<?php
/**
 * Database Connection Test Script
 * Run this to diagnose DB issues in XAMPP
 */

// Define access constant
define('EXELOKA_ACCESS', true);

// Load environment variables with custom parser
if (file_exists(__DIR__ . '/.env')) {
    $envFile = file_get_contents(__DIR__ . '/.env');
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

// Database configuration
$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_USER = getenv('DB_USERNAME') ?: 'root';
$DB_PASS = getenv('DB_PASSWORD') ?: '';
$DB_NAME = getenv('DB_DATABASE') ?: 'exeloka';

echo "<h2>🔧 Exeloka Database Connection Test</h2>\n";
echo "<p><strong>Timestamp:</strong> " . date('Y-m-d H:i:s') . "</p>\n";

echo "<h3>📊 Configuration</h3>\n";
echo "<ul>\n";
echo "<li><strong>Host:</strong> $DB_HOST</li>\n";
echo "<li><strong>Username:</strong> $DB_USER</li>\n";
echo "<li><strong>Password:</strong> " . (empty($DB_PASS) ? 'Empty' : 'Set') . "</li>\n";
echo "<li><strong>Database:</strong> $DB_NAME</li>\n";
echo "</ul>\n";

// Test 1: PDO Extension
echo "<h3>🔍 Test 1: PDO Extension</h3>\n";
if (extension_loaded('pdo')) {
    echo "<p style='color: green;'>✅ PDO extension is loaded</p>\n";
    
    if (extension_loaded('pdo_mysql')) {
        echo "<p style='color: green;'>✅ PDO MySQL driver is loaded</p>\n";
    } else {
        echo "<p style='color: red;'>❌ PDO MySQL driver is NOT loaded</p>\n";
    }
} else {
    echo "<p style='color: red;'>❌ PDO extension is NOT loaded</p>\n";
}

// Test 2: MySQL Connection
echo "<h3>🔗 Test 2: MySQL Connection</h3>\n";
try {
    $dsn = "mysql:host=$DB_HOST;charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    echo "<p style='color: green;'>✅ MySQL connection successful</p>\n";
    
    // Test 3: Database Exists
    echo "<h3>💾 Test 3: Database '$DB_NAME'</h3>\n";
    $stmt = $pdo->query("SHOW DATABASES");
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (in_array($DB_NAME, $databases)) {
        echo "<p style='color: green;'>✅ Database '$DB_NAME' exists</p>\n";
        
        // Switch to the database
        $pdo->exec("USE $DB_NAME");
        
        // Test 4: Tables Check
        echo "<h3>📋 Test 4: Tables Check</h3>\n";
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $expectedTables = ['users', 'projects', 'recommendations', 'knowledge_sources', 'knowledge_categories'];
        echo "<p><strong>Expected tables:</strong> " . implode(', ', $expectedTables) . "</p>\n";
        echo "<p><strong>Found tables (" . count($tables) . "):</strong> " . implode(', ', $tables) . "</p>\n";
        
        $missing = array_diff($expectedTables, $tables);
        if (empty($missing)) {
            echo "<p style='color: green;'>✅ All expected tables exist</p>\n";
            
            // Test 5: Sample Data
            echo "<h3>📊 Test 5: Sample Data</h3>\n";
            try {
                $stmt = $pdo->query("SELECT COUNT(*) FROM users");
                $userCount = $stmt->fetchColumn();
                echo "<p><strong>Users:</strong> $userCount</p>\n";
                
                $stmt = $pdo->query("SELECT COUNT(*) FROM projects");
                $projectCount = $stmt->fetchColumn();
                echo "<p><strong>Projects:</strong> $projectCount</p>\n";
                
                $stmt = $pdo->query("SELECT COUNT(*) FROM knowledge_sources");
                $knowledgeCount = $stmt->fetchColumn();
                echo "<p><strong>Knowledge Sources:</strong> $knowledgeCount</p>\n";
                
                if ($userCount > 0) {
                    echo "<p style='color: green;'>✅ Sample data exists</p>\n";
                    
                    // Test sample user
                    $stmt = $pdo->query("SELECT email, full_name FROM users LIMIT 1");
                    $user = $stmt->fetch();
                    echo "<p><strong>Sample user:</strong> {$user['full_name']} ({$user['email']})</p>\n";
                } else {
                    echo "<p style='color: orange;'>⚠️ No sample data found - database may need to be populated</p>\n";
                }
            } catch (Exception $e) {
                echo "<p style='color: red;'>❌ Error querying data: " . $e->getMessage() . "</p>\n";
            }
        } else {
            echo "<p style='color: red;'>❌ Missing tables: " . implode(', ', $missing) . "</p>\n";
        }
        
    } else {
        echo "<p style='color: red;'>❌ Database '$DB_NAME' does NOT exist</p>\n";
        echo "<p><strong>Available databases:</strong> " . implode(', ', $databases) . "</p>\n";
        echo "<p style='color: blue;'>💡 <strong>Solution:</strong> Import database/schema.sql to create the database</p>\n";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ MySQL connection failed: " . $e->getMessage() . "</p>\n";
    
    if (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "<p style='color: blue;'>💡 <strong>Solution:</strong> Check MySQL username/password in .env file or XAMPP settings</p>\n";
    } elseif (strpos($e->getMessage(), 'Connection refused') !== false) {
        echo "<p style='color: blue;'>💡 <strong>Solution:</strong> Make sure MySQL is running in XAMPP Control Panel</p>\n";
    }
}

// Test 6: Environment File
echo "<h3>⚙️ Test 6: Environment Configuration</h3>\n";
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    echo "<p style='color: green;'>✅ .env file exists</p>\n";
    $envContent = file_get_contents($envFile);
    echo "<pre style='background: #f5f5f5; padding: 10px; border: 1px solid #ddd;'>" . htmlspecialchars($envContent) . "</pre>\n";
} else {
    echo "<p style='color: orange;'>⚠️ .env file does not exist</p>\n";
    echo "<p style='color: blue;'>💡 <strong>Solution:</strong> Create .env file with database configuration</p>\n";
}

echo "<h3>🚀 Next Steps</h3>\n";
echo "<ol>\n";
echo "<li>If MySQL is not running: Start it in XAMPP Control Panel</li>\n";
echo "<li>If database doesn't exist: Import database/schema.sql via phpMyAdmin</li>\n";
echo "<li>If connection fails: Check .env file configuration</li>\n";
echo "<li>If all tests pass: The API should work correctly</li>\n";
echo "</ol>\n";

echo "<hr>\n";
echo "<p><em>Test completed at " . date('Y-m-d H:i:s') . "</em></p>\n";
?>