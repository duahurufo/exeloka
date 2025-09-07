<?php
/**
 * Exeloka v1 - Authentication API
 * Secure authentication endpoints
 */

// Define access constant before including config
define('EXELOKA_ACCESS', true);
require_once 'config.php';

setCorsHeaders();
checkRateLimit();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

// Sanitize and validate input
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE && $method === 'POST') {
    logSecurityEvent('invalid_json', ['error' => json_last_error_msg()]);
    jsonResponse(['error' => 'Invalid JSON format'], 400);
}

switch($method) {
    case 'POST':
        $action = sanitizeInput($data['action'] ?? '');
        
        switch($action) {
            case 'login':
                login($pdo, $data);
                break;
            case 'register':
                register($pdo, $data);
                break;
            case 'logout':
                logout();
                break;
            case 'check':
                checkAuthStatus();
                break;
            default:
                logSecurityEvent('invalid_action', ['action' => $action]);
                jsonResponse(['error' => 'Invalid action'], 400);
        }
        break;
    case 'GET':
        // Get current user info
        getUserInfo();
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

function login($pdo, $data) {
    $email = sanitizeInput($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    // Validation
    if (empty($email) || empty($password)) {
        logSecurityEvent('login_attempt_missing_fields', ['email' => $email]);
        jsonResponse(['error' => 'Email and password required'], 400);
    }
    
    if (!validateEmail($email)) {
        logSecurityEvent('login_attempt_invalid_email', ['email' => $email]);
        jsonResponse(['error' => 'Invalid email format'], 400);
    }
    
    // Rate limiting for login attempts
    checkRateLimit('login_' . $email);
    
    try {
        $stmt = $pdo->prepare("SELECT id, email, full_name, company_name, password, failed_login_attempts, locked_until FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            logSecurityEvent('login_attempt_user_not_found', ['email' => $email]);
            sleep(1); // Prevent timing attacks
            jsonResponse(['error' => 'Invalid credentials'], 401);
        }
        
        // Check if account is locked
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            logSecurityEvent('login_attempt_account_locked', ['email' => $email]);
            jsonResponse(['error' => 'Account temporarily locked'], 423);
        }
        
        if (password_verify($password, $user['password'])) {
            // Reset failed attempts on successful login
            $stmt = $pdo->prepare("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            startSecureSession();
            session_regenerate_id(true);
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['company_name'] = $user['company_name'];
            $_SESSION['created'] = time();
            $_SESSION['ip'] = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            
            logSecurityEvent('login_successful', ['email' => $email, 'user_id' => $user['id']]);
            
            jsonResponse([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'full_name' => $user['full_name'],
                    'company_name' => $user['company_name']
                ]
            ]);
        } else {
            // Increment failed attempts
            $failedAttempts = ($user['failed_login_attempts'] ?? 0) + 1;
            $lockTime = null;
            
            if ($failedAttempts >= 5) {
                $lockTime = date('Y-m-d H:i:s', time() + 900); // Lock for 15 minutes
            }
            
            $stmt = $pdo->prepare("UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?");
            $stmt->execute([$failedAttempts, $lockTime, $user['id']]);
            
            logSecurityEvent('login_failed', [
                'email' => $email,
                'failed_attempts' => $failedAttempts,
                'locked' => $lockTime !== null
            ]);
            
            sleep(1); // Prevent timing attacks
            jsonResponse(['error' => 'Invalid credentials'], 401);
        }
    } catch(PDOException $e) {
        error_log("Login database error: " . $e->getMessage());
        jsonResponse(['error' => 'Service temporarily unavailable'], 500);
    }
}

function register($pdo, $data) {
    $email = sanitizeInput($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $full_name = sanitizeInput($data['full_name'] ?? '');
    $company_name = sanitizeInput($data['company_name'] ?? '');
    
    // Validation
    if (empty($email) || empty($password) || empty($full_name) || empty($company_name)) {
        jsonResponse(['error' => 'All fields are required'], 400);
    }
    
    if (!validateEmail($email)) {
        jsonResponse(['error' => 'Invalid email format'], 400);
    }
    
    // Password strength validation
    if (strlen($password) < 8) {
        jsonResponse(['error' => 'Password must be at least 8 characters long'], 400);
    }
    
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        jsonResponse(['error' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number'], 400);
    }
    
    try {
        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            logSecurityEvent('registration_attempt_duplicate_email', ['email' => $email]);
            jsonResponse(['error' => 'User already exists'], 400);
        }
        
        // Create new user
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $currentTime = date('Y-m-d H:i:s');
        
        $stmt = $pdo->prepare("INSERT INTO users (email, password, full_name, company_name, created_at, failed_login_attempts) VALUES (?, ?, ?, ?, ?, 0)");
        $stmt->execute([$email, $hashedPassword, $full_name, $company_name, $currentTime]);
        
        $userId = $pdo->lastInsertId();
        
        // Start secure session
        startSecureSession();
        session_regenerate_id(true);
        
        $_SESSION['user_id'] = $userId;
        $_SESSION['email'] = $email;
        $_SESSION['full_name'] = $full_name;
        $_SESSION['company_name'] = $company_name;
        $_SESSION['created'] = time();
        $_SESSION['ip'] = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        logSecurityEvent('registration_successful', [
            'email' => $email,
            'user_id' => $userId,
            'company' => $company_name
        ]);
        
        jsonResponse([
            'message' => 'Registration successful',
            'user' => [
                'id' => $userId,
                'email' => $email,
                'full_name' => $full_name,
                'company_name' => $company_name
            ]
        ]);
    } catch(PDOException $e) {
        error_log("Registration database error: " . $e->getMessage());
        jsonResponse(['error' => 'Service temporarily unavailable'], 500);
    }
}

function logout() {
    $userId = getCurrentUserId();
    
    if ($userId) {
        logSecurityEvent('logout', ['user_id' => $userId]);
    }
    
    startSecureSession();
    session_destroy();
    
    // Clear session cookie
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    
    jsonResponse(['message' => 'Logout successful']);
}

function checkAuthStatus() {
    $userId = getCurrentUserId();
    
    if ($userId) {
        startSecureSession();
        jsonResponse([
            'authenticated' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'email' => $_SESSION['email'],
                'full_name' => $_SESSION['full_name'],
                'company_name' => $_SESSION['company_name']
            ]
        ]);
    } else {
        jsonResponse(['authenticated' => false]);
    }
}

function getUserInfo() {
    $userId = requireAuth();
    
    try {
        $pdo = getConnection();
        $stmt = $pdo->prepare("SELECT id, email, full_name, company_name, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if ($user) {
            jsonResponse([
                'user' => $user
            ]);
        } else {
            jsonResponse(['error' => 'User not found'], 404);
        }
    } catch(PDOException $e) {
        error_log("Get user info error: " . $e->getMessage());
        jsonResponse(['error' => 'Service temporarily unavailable'], 500);
    }
}
?>