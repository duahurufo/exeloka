<?php
/**
 * Sample page showing how to use the includes system
 */

// Define access constant
define('EXELOKA_ACCESS', true);

// Set base path for includes (adjust based on page location)
$basePath = './'; // For root level pages
// $basePath = '../'; // For pages in subdirectories

// Get user data if needed
$userData = null; // You can load this from session or API

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Page - Exeloka</title>
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/style.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>

    <main class="main">
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">Sample Page</h1>
                <p class="page-subtitle">This demonstrates the includes system</p>
            </div>

            <div class="card">
                <h2>Using Includes</h2>
                <p>This page demonstrates how to use the new includes system:</p>
                <ul>
                    <li><strong>Header:</strong> <code>includes/header.php</code> - Full navigation header</li>
                    <li><strong>Auth Header:</strong> <code>includes/auth-header.php</code> - Simple header for login pages</li>
                    <li><strong>Footer:</strong> <code>includes/footer.php</code> - Full footer with links</li>
                    <li><strong>Simple Footer:</strong> <code>includes/simple-footer.php</code> - Minimal footer</li>
                    <li><strong>Common JS:</strong> <code>includes/common.js</code> - Shared JavaScript utilities</li>
                </ul>
            </div>

            <div class="card">
                <h2>Benefits</h2>
                <ul>
                    <li>✅ Centralized header/footer management</li>
                    <li>✅ Consistent navigation across all pages</li>
                    <li>✅ Easy to update branding or links</li>
                    <li>✅ Reusable JavaScript utilities</li>
                    <li>✅ Better maintainability</li>
                </ul>
            </div>
        </div>
    </main>

    <?php include 'includes/footer.php'; ?>

    <!-- Include common JavaScript -->
    <script src="<?php echo $basePath; ?>assets/js/api.js"></script>
    <script src="<?php echo $basePath; ?>includes/common.js"></script>
</body>
</html>