<?php
/**
 * Exeloka v1 - Global Footer Component
 * Reusable footer for all pages
 */

// Prevent direct access
if (!defined('EXELOKA_ACCESS')) {
    die('Direct access not allowed');
}

// Set base path for links
$basePath = isset($basePath) ? $basePath : '';
?>
<footer style="background: var(--dark); color: white; padding: 2rem 0; margin-top: 4rem;">
    <div class="container">
        <div class="row">
            <div class="col-6">
                <h3 style="color: white; margin-bottom: 1rem;">Exeloka</h3>
                <p style="opacity: 0.8; margin-bottom: 1rem;">
                    Cultural Wisdom Recommendation System for Sampang, East Java, Indonesia. 
                    Helping companies navigate cultural complexities and build meaningful community relationships.
                </p>
                <p style="opacity: 0.6; font-size: 0.9rem;">
                    Built with cultural sensitivity and community focus in mind.
                </p>
            </div>
            <div class="col-3">
                <h4 style="color: white; margin-bottom: 1rem;">Quick Links</h4>
                <ul style="list-style: none; padding: 0; line-height: 2;">
                    <li><a href="<?php echo $basePath; ?>dashboard.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Dashboard</a></li>
                    <li><a href="<?php echo $basePath; ?>projects/" style="color: rgba(255,255,255,0.8); text-decoration: none;">Projects</a></li>
                    <li><a href="<?php echo $basePath; ?>knowledge/" style="color: rgba(255,255,255,0.8); text-decoration: none;">Knowledge Base</a></li>
                    <li><a href="<?php echo $basePath; ?>recommendations/" style="color: rgba(255,255,255,0.8); text-decoration: none;">Recommendations</a></li>
                </ul>
            </div>
            <div class="col-3">
                <h4 style="color: white; margin-bottom: 1rem;">Support</h4>
                <ul style="list-style: none; padding: 0; line-height: 2;">
                    <li><a href="<?php echo $basePath; ?>help.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Help Center</a></li>
                    <li><a href="<?php echo $basePath; ?>docs/" style="color: rgba(255,255,255,0.8); text-decoration: none;">Documentation</a></li>
                    <li><a href="<?php echo $basePath; ?>contact.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Contact Support</a></li>
                    <li><a href="<?php echo $basePath; ?>feedback.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Feedback</a></li>
                </ul>
            </div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.2); margin-top: 2rem; padding-top: 1rem; text-align: center;">
            <p style="opacity: 0.6; margin: 0;">
                &copy; 2024 Exeloka. All rights reserved. | 
                <a href="<?php echo $basePath; ?>privacy.html" style="color: rgba(255,255,255,0.6);">Privacy Policy</a> | 
                <a href="<?php echo $basePath; ?>terms.html" style="color: rgba(255,255,255,0.6);">Terms of Service</a>
            </p>
        </div>
    </div>
</footer>