/**
 * Exeloka v1 - Component System for HTML Pages
 * JavaScript-based includes for HTML files
 */

window.ExelokaComponents = {
    // Base path detection
    getBasePath: function() {
        const path = window.location.pathname;
        if (path.includes('/projects/')) return '../';
        if (path.includes('/knowledge/')) return '../';
        if (path.includes('/recommendations/')) return '../';
        return '';
    },

    // Main navigation header
    renderHeader: function(currentSection = '') {
        const basePath = this.getBasePath();
        return `
            <header class="header">
                <div class="container">
                    <div class="header-content">
                        <a href="${basePath}dashboard.html" class="logo">Exeloka</a>
                        <nav>
                            <ul class="nav">
                                <li><a href="${basePath}dashboard.html" class="${currentSection === 'dashboard' ? 'active' : ''}">Dashboard</a></li>
                                <li><a href="${basePath}projects/" class="${currentSection === 'projects' ? 'active' : ''}">Projects</a></li>
                                <li><a href="${basePath}knowledge/" class="${currentSection === 'knowledge' ? 'active' : ''}">Knowledge</a></li>
                                <li><a href="${basePath}recommendations/" class="${currentSection === 'recommendations' ? 'active' : ''}">Recommendations</a></li>
                            </ul>
                        </nav>
                        <div class="user-menu">
                            <button class="user-btn dropdown-btn" onclick="toggleUserMenu()">
                                <span id="userName">User</span>
                            </button>
                            <div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid var(--border); border-radius: 0.375rem; box-shadow: var(--shadow); min-width: 150px; z-index: 1000;">
                                <a href="${basePath}profile.html" style="display: block; padding: 0.5rem 1rem; text-decoration: none; color: var(--secondary); border-bottom: 1px solid var(--border);">Profile</a>
                                <a href="#" onclick="logout()" style="display: block; padding: 0.5rem 1rem; text-decoration: none; color: var(--secondary);">Logout</a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    },

    // Authentication header (for login/register pages)
    renderAuthHeader: function() {
        const basePath = this.getBasePath();
        return `
            <header class="header">
                <div class="container">
                    <div class="header-content">
                        <a href="${basePath}index.html" class="logo">Exeloka</a>
                        <nav>
                            <ul class="nav">
                                <li><a href="${basePath}index.html">Home</a></li>
                                <li><a href="${basePath}projects/index.html">Proyek</a></li>
                                <li><a href="${basePath}recommendations/index.html">Rekomendasi</a></li>
                                <li><a href="${basePath}documents.html">Dokumen</a></li>
                                <li><a href="${basePath}profile.html">Profil</a></li>
                                <li><a href="${basePath}login.html">Login</a></li>
                                <li><a href="${basePath}register.html">Register</a></li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </header>
        `;
    },

    // Full footer
    renderFooter: function() {
        const basePath = this.getBasePath();
        return `
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
                                <li><a href="${basePath}dashboard.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Dashboard</a></li>
                                <li><a href="${basePath}projects/" style="color: rgba(255,255,255,0.8); text-decoration: none;">Projects</a></li>
                                <li><a href="${basePath}knowledge/" style="color: rgba(255,255,255,0.8); text-decoration: none;">Knowledge Base</a></li>
                                <li><a href="${basePath}recommendations/" style="color: rgba(255,255,255,0.8); text-decoration: none;">Recommendations</a></li>
                            </ul>
                        </div>
                        <div class="col-3">
                            <h4 style="color: white; margin-bottom: 1rem;">Support</h4>
                            <ul style="list-style: none; padding: 0; line-height: 2;">
                                <li><a href="${basePath}help.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Help Center</a></li>
                                <li><a href="${basePath}docs/" style="color: rgba(255,255,255,0.8); text-decoration: none;">Documentation</a></li>
                                <li><a href="${basePath}contact.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Contact Support</a></li>
                                <li><a href="${basePath}feedback.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Feedback</a></li>
                            </ul>
                        </div>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.2); margin-top: 2rem; padding-top: 1rem; text-align: center;">
                        <p style="opacity: 0.6; margin: 0;">
                            &copy; 2024 Exeloka. All rights reserved. | 
                            <a href="${basePath}privacy.html" style="color: rgba(255,255,255,0.6);">Privacy Policy</a> | 
                            <a href="${basePath}terms.html" style="color: rgba(255,255,255,0.6);">Terms of Service</a>
                        </p>
                    </div>
                </div>
            </footer>
        `;
    },

    // Simple footer (for login/register pages)
    renderSimpleFooter: function() {
        return `
            <footer style="background: var(--dark); color: white; padding: 2rem 0; text-align: center; margin-top: auto;">
                <div class="container">
                    <p>&copy; 2024 Exeloka. Cultural Wisdom Recommendation System for Sampang, East Java.</p>
                    <p style="margin-top: 0.5rem; opacity: 0.7; font-size: 0.9rem;">
                        Built to help companies navigate cultural complexities and build meaningful community relationships.
                    </p>
                </div>
            </footer>
        `;
    },

    // Initialize components on page load
    init: function() {
        document.addEventListener('DOMContentLoaded', () => {
            // Replace header placeholder
            const headerPlaceholder = document.querySelector('[data-component="header"]');
            if (headerPlaceholder) {
                const currentSection = headerPlaceholder.getAttribute('data-current') || '';
                headerPlaceholder.outerHTML = this.renderHeader(currentSection);
            }

            // Replace auth header placeholder
            const authHeaderPlaceholder = document.querySelector('[data-component="auth-header"]');
            if (authHeaderPlaceholder) {
                authHeaderPlaceholder.outerHTML = this.renderAuthHeader();
            }

            // Replace footer placeholder
            const footerPlaceholder = document.querySelector('[data-component="footer"]');
            if (footerPlaceholder) {
                footerPlaceholder.outerHTML = this.renderFooter();
            }

            // Replace simple footer placeholder
            const simpleFooterPlaceholder = document.querySelector('[data-component="simple-footer"]');
            if (simpleFooterPlaceholder) {
                simpleFooterPlaceholder.outerHTML = this.renderSimpleFooter();
            }

            // Initialize common functionality
            this.setupEventListeners();
            this.updateUserDisplay();
        });
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Close dropdown when clicking outside (with delegation since header is dynamic)
        document.addEventListener('click', function(event) {
            const userMenu = document.querySelector('.user-menu');
            const dropdown = document.getElementById('userDropdown');
            if (userMenu && dropdown && !userMenu.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    },

    // Update user display
    updateUserDisplay: function() {
        const user = this.getUser();
        // Use setTimeout to ensure the header is rendered first
        setTimeout(() => {
            const userNameElement = document.getElementById('userName');
            if (user && userNameElement) {
                userNameElement.textContent = user.full_name || user.email || 'User';
            }
        }, 0);
    },

    // Get user data
    getUser: function() {
        try {
            return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');
        } catch (e) {
            return null;
        }
    }
};

// Initialize the component system
ExelokaComponents.init();

// Global function aliases for compatibility
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function logout() {
    sessionStorage.removeItem('user');
    localStorage.removeItem('user');
    window.location.href = ExelokaComponents.getBasePath() + 'login.html';
}