<?php
/**
 * Exeloka v1 - Global Header Component
 * Reusable header for all authenticated pages
 */

// Prevent direct access
if (!defined('EXELOKA_ACCESS')) {
    die('Direct access not allowed');
}

// Get current page for active navigation
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$basePath = isset($basePath) ? $basePath : '';

// User data should be passed or retrieved
$userData = $userData ?? null;
?>
<header class="header">
    <div class="container">
        <div class="header-content">
            <a href="<?php echo $basePath; ?>dashboard.html" class="logo">Exeloka</a>
            <nav>
                <ul class="nav">
                    <li><a href="<?php echo $basePath; ?>dashboard.html" class="<?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>">Dashboard</a></li>
                    <li><a href="<?php echo $basePath; ?>projects/" class="<?php echo strpos($_SERVER['REQUEST_URI'], '/projects/') !== false ? 'active' : ''; ?>">Projects</a></li>
                    <li><a href="<?php echo $basePath; ?>knowledge/" class="<?php echo strpos($_SERVER['REQUEST_URI'], '/knowledge/') !== false ? 'active' : ''; ?>">Knowledge</a></li>
                    <li><a href="<?php echo $basePath; ?>recommendations/" class="<?php echo strpos($_SERVER['REQUEST_URI'], '/recommendations/') !== false ? 'active' : ''; ?>">Recommendations</a></li>
                </ul>
            </nav>
            <div class="user-menu">
                <button class="user-btn" onclick="toggleUserMenu()">
                    <span id="userName"><?php echo $userData ? htmlspecialchars($userData['full_name'] ?? $userData['email']) : 'User'; ?></span> ▼
                </button>
                <div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid var(--border); border-radius: 0.375rem; box-shadow: var(--shadow); min-width: 150px; z-index: 1000;">
                    <a href="<?php echo $basePath; ?>profile.html" style="display: block; padding: 0.5rem 1rem; text-decoration: none; color: var(--secondary); border-bottom: 1px solid var(--border);">Profile</a>
                    <a href="#" onclick="logout()" style="display: block; padding: 0.5rem 1rem; text-decoration: none; color: var(--secondary);">Logout</a>
                </div>
            </div>
        </div>
    </div>
</header>