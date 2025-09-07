<?php
/**
 * Exeloka v1 - Simple Footer Component
 * Lightweight footer for login/register pages
 */

// Prevent direct access
if (!defined('EXELOKA_ACCESS')) {
    die('Direct access not allowed');
}

// Set base path for links
$basePath = isset($basePath) ? $basePath : '';
?>
<footer style="background: var(--dark); color: white; padding: 2rem 0; text-align: center; margin-top: auto;">
    <div class="container">
        <p>&copy; 2024 Exeloka. Cultural Wisdom Recommendation System for Sampang, East Java.</p>
        <p style="margin-top: 0.5rem; opacity: 0.7; font-size: 0.9rem;">
            Built to help companies navigate cultural complexities and build meaningful community relationships.
        </p>
    </div>
</footer>