<?php
/**
 * Exeloka v1 - Secure Configuration File
 * Cultural Wisdom Recommendation System
 */

// Prevent direct access
if (!defined('EXELOKA_ACCESS')) {
    die('Direct access not allowed');
}

// Load environment variables with custom parser
if (file_exists(__DIR__ . '/../.env')) {
    $envFile = file_get_contents(__DIR__ . '/../.env');
    $lines = explode("\n", $envFile);
    
    foreach ($lines as $line) {
        $line = trim($line);
        
        // Skip empty lines and comments
        if (empty($line) || $line[0] === ';' || $line[0] === '#') {
            continue;
        }
        
        // Parse KEY=VALUE pairs
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value, '"\'');
            
            if (!getenv($key)) {
                putenv("$key=$value");
            }
        }
    }
}

// Security configurations
ini_set('display_errors', getenv('APP_DEBUG') === 'true' ? 1 : 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// Session security
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', getenv('SESSION_SECURE') ?: 0);
ini_set('session.cookie_samesite', getenv('SESSION_SAME_SITE') ?: 'Lax');
ini_set('session.use_strict_mode', 1);
ini_set('session.gc_maxlifetime', getenv('SESSION_LIFETIME') * 60 ?: 7200);

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USERNAME') ?: 'root');
define('DB_PASS', getenv('DB_PASSWORD') ?: '');
define('DB_NAME', getenv('DB_DATABASE') ?: 'exeloka');
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');

// Rate limiting storage
$RATE_LIMIT_REQUESTS = [];

/**
 * Create secure database connection
 */
function getConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch(PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            die("Service temporarily unavailable");
        }
    }
    
    return $pdo;
}

/**
 * Set secure CORS headers
 */
function setCorsHeaders() {
    $allowedOrigins = explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: '*');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
        header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
    }
    
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Methods: ' . (getenv('CORS_ALLOWED_METHODS') ?: 'GET, POST, PUT, DELETE, OPTIONS'));
    header('Access-Control-Allow-Headers: ' . (getenv('CORS_ALLOWED_HEADERS') ?: 'Content-Type, Authorization, X-Requested-With'));
    header('Access-Control-Max-Age: ' . (getenv('CORS_MAX_AGE') ?: '3600'));
    
    if (getenv('CORS_CREDENTIALS') === 'true') {
        header('Access-Control-Allow-Credentials: true');
    }
    
    // Security headers
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Rate limiting check
 */
function checkRateLimit($identifier = null) {
    global $RATE_LIMIT_REQUESTS;
    
    if (!getenv('RATE_LIMIT_ENABLED')) {
        return true;
    }
    
    $identifier = $identifier ?: ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $currentTime = time();
    $limit = (int)(getenv('RATE_LIMIT_REQUESTS_PER_MINUTE') ?: 60);
    $window = 60; // 1 minute window
    
    // Clean old entries
    $RATE_LIMIT_REQUESTS[$identifier] = array_filter(
        $RATE_LIMIT_REQUESTS[$identifier] ?? [],
        function($timestamp) use ($currentTime, $window) {
            return ($currentTime - $timestamp) < $window;
        }
    );
    
    // Check if limit exceeded
    if (count($RATE_LIMIT_REQUESTS[$identifier]) >= $limit) {
        jsonResponse(['error' => 'Rate limit exceeded'], 429);
    }
    
    // Add current request
    $RATE_LIMIT_REQUESTS[$identifier][] = $currentTime;
    
    return true;
}

/**
 * Secure JSON response
 */
function jsonResponse($data, $status = 200) {
    // Add security headers to response
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    http_response_code($status);
    
    $response = [
        'success' => $status < 400,
        'timestamp' => date('c'),
        'data' => $data
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Input sanitization
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return is_string($input) ? trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8')) : $input;
}

/**
 * Validate email format
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Secure session management
 */
function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
        
        // Regenerate session ID periodically
        if (!isset($_SESSION['created'])) {
            $_SESSION['created'] = time();
        } elseif (time() - $_SESSION['created'] > 1800) { // 30 minutes
            session_regenerate_id(true);
            $_SESSION['created'] = time();
        }
    }
}

/**
 * Get current user ID with session validation
 */
function getCurrentUserId() {
    startSecureSession();
    
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['created'])) {
        return null;
    }
    
    // Check session timeout
    $maxLifetime = (int)(getenv('SESSION_LIFETIME') ?: 120) * 60;
    if (time() - $_SESSION['created'] > $maxLifetime) {
        session_destroy();
        return null;
    }
    
    return $_SESSION['user_id'];
}

/**
 * Require authentication
 */
function requireAuth() {
    checkRateLimit();
    $userId = getCurrentUserId();
    
    if (!$userId) {
        jsonResponse(['error' => 'Authentication required'], 401);
    }
    
    return $userId;
}

/**
 * Log security events
 */
function logSecurityEvent($event, $details = []) {
    $logEntry = [
        'timestamp' => date('c'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'event' => $event,
        'details' => $details
    ];
    
    $logFile = __DIR__ . '/../logs/security.log';
    if (!file_exists(dirname($logFile))) {
        mkdir(dirname($logFile), 0755, true);
    }
    
    file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

// Define access constant for other files
define('EXELOKA_ACCESS', true);
?>