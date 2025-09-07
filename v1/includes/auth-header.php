<?php
/**
 * Exeloka v1 - Authentication Header Component
 * Simple header for login/register pages
 */

// Prevent direct access
if (!defined('EXELOKA_ACCESS')) {
    die('Direct access not allowed');
}

// Set base path for links
$basePath = isset($basePath) ? $basePath : '';
?>
<header class="header">
    <div class="container">
        <div class="header-content">
            <a href="<?php echo $basePath; ?>index.html" class="logo">Exeloka</a>
            <nav>
                <ul class="nav">
                    <li><a href="<?php echo $basePath; ?>index.html">Home</a></li>
                    <li><a href="<?php echo $basePath; ?>login.html">Login</a></li>
                    <li><a href="<?php echo $basePath; ?>register.html">Register</a></li>
                </ul>
            </nav>
        </div>
    </div>
</header>