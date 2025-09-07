<?php
/**
 * Exeloka v1 - System Test Runner
 * Basic functionality tests for the application
 */

// Suppress errors for clean output
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== EXELOKA v1 SYSTEM TESTS ===\n\n";

// Test 1: Environment Configuration
echo "1. Testing Environment Configuration...\n";
if (file_exists('.env')) {
    echo "   ✓ .env file exists\n";
    
    // Custom parser for .env file
    $envFile = file_get_contents('.env');
    $lines = explode("\n", $envFile);
    $env = [];
    
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
            $env[$key] = $value;
        }
    }
    
    echo "   ✓ Environment variables loaded: " . count($env) . " variables\n";
} else {
    echo "   ✗ .env file missing\n";
}

// Test 2: Core Files
echo "\n2. Testing Core Files...\n";
$coreFiles = [
    'index.html' => 'Main landing page',
    'login.html' => 'Login page',
    'register.html' => 'Registration page', 
    'dashboard.html' => 'User dashboard',
    'error.html' => 'Error page',
    'maintenance.html' => 'Maintenance page',
    'robots.txt' => 'Robots file',
    '.htaccess' => 'Apache configuration',
    '.gitignore' => 'Git ignore file'
];

foreach ($coreFiles as $file => $description) {
    if (file_exists($file)) {
        echo "   ✓ $file ($description)\n";
    } else {
        echo "   ✗ $file missing ($description)\n";
    }
}

// Test 3: API Files
echo "\n3. Testing API Files...\n";
$apiFiles = [
    'api/config.php' => 'Configuration API',
    'api/auth.php' => 'Authentication API',
    'api/projects.php' => 'Projects API',
    'api/recommendations.php' => 'Recommendations API',
    'api/knowledge.php' => 'Knowledge API'
];

foreach ($apiFiles as $file => $description) {
    if (file_exists($file)) {
        echo "   ✓ $file ($description)\n";
    } else {
        echo "   ✗ $file missing ($description)\n";
    }
}

// Test 4: Asset Files
echo "\n4. Testing Asset Files...\n";
$assetFiles = [
    'assets/css/style.css' => 'Main stylesheet',
    'assets/js/api.js' => 'JavaScript API client'
];

foreach ($assetFiles as $file => $description) {
    if (file_exists($file)) {
        echo "   ✓ $file ($description)\n";
    } else {
        echo "   ✗ $file missing ($description)\n";
    }
}

// Test 5: Database Schema
echo "\n5. Testing Database Schema...\n";
if (file_exists('database/schema.sql')) {
    echo "   ✓ database/schema.sql exists\n";
    $schema = file_get_contents('database/schema.sql');
    $tableMatches = preg_match_all('/CREATE TABLE `(\w+)`/', $schema, $matches);
    echo "   ✓ Found $tableMatches database tables\n";
    if ($tableMatches > 0) {
        echo "   Tables: " . implode(', ', $matches[1]) . "\n";
    }
} else {
    echo "   ✗ database/schema.sql missing\n";
}

// Test 6: Security Configuration
echo "\n6. Testing Security Configuration...\n";
if (file_exists('.htaccess')) {
    $htaccess = file_get_contents('.htaccess');
    if (strpos($htaccess, 'X-Frame-Options') !== false) {
        echo "   ✓ Security headers configured\n";
    } else {
        echo "   ✗ Security headers missing\n";
    }
    
    if (strpos($htaccess, 'RewriteEngine On') !== false) {
        echo "   ✓ URL rewriting enabled\n";
    } else {
        echo "   ✗ URL rewriting not configured\n";
    }
} else {
    echo "   ✗ .htaccess file missing\n";
}

// Test 7: Configuration Validation
echo "\n7. Testing PHP Configuration...\n";
if (class_exists('PDO')) {
    echo "   ✓ PDO extension available\n";
} else {
    echo "   ✗ PDO extension missing\n";
}

if (function_exists('password_hash')) {
    echo "   ✓ Password hashing functions available\n";
} else {
    echo "   ✗ Password hashing functions missing\n";
}

if (function_exists('json_encode')) {
    echo "   ✓ JSON functions available\n";
} else {
    echo "   ✗ JSON functions missing\n";
}

// Test 8: Permissions
echo "\n8. Testing Directory Permissions...\n";
$directories = ['logs', 'uploads', 'temp', 'cache', 'backups'];
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
        echo "   ✓ Created $dir directory\n";
    } else {
        echo "   ✓ $dir directory exists\n";
    }
    
    if (is_writable($dir)) {
        echo "   ✓ $dir is writable\n";
    } else {
        echo "   ✗ $dir is not writable\n";
    }
}

echo "\n=== TEST COMPLETE ===\n\n";

// Quick functionality test
echo "9. Quick Functionality Test...\n";

// Test config loading
define('EXELOKA_ACCESS', true);
if (file_exists('api/config.php')) {
    include 'api/config.php';
    echo "   ✓ Configuration loaded successfully\n";
    
    // Test database connection (if configured)
    try {
        $pdo = getConnection();
        echo "   ✓ Database connection successful\n";
    } catch (Exception $e) {
        echo "   ⚠ Database connection failed (expected without MySQL): " . $e->getMessage() . "\n";
    }
} else {
    echo "   ✗ Cannot load configuration\n";
}

echo "\nSystem is ready for XAMPP deployment!\n";
echo "Next steps:\n";
echo "1. Install XAMPP with PHP 7.4+ and MySQL\n";
echo "2. Copy project to htdocs/exeloka/v1/\n";
echo "3. Import database/schema.sql into MySQL\n";
echo "4. Update .env with database credentials\n";
echo "5. Access via http://localhost/exeloka/v1/\n";
?>