/**
 * Exeloka v1 - Common JavaScript Functions
 * Shared utilities for all pages
 */

// Global utilities that all pages can use
window.ExelokaCommon = {
    // User menu management
    toggleUserMenu: function() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    },

    // Authentication functions
    logout: function() {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        window.location.href = this.getBasePath() + 'login.html';
    },

    checkAuth: function() {
        const user = sessionStorage.getItem('user') || localStorage.getItem('user');
        return !!user;
    },

    requireAuth: function() {
        if (!this.checkAuth()) {
            window.location.href = this.getBasePath() + 'login.html';
            return false;
        }
        return true;
    },

    getUser: function() {
        try {
            return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');
        } catch (e) {
            return null;
        }
    },

    updateUserDisplay: function() {
        const user = this.getUser();
        const userNameElement = document.getElementById('userName');
        if (user && userNameElement) {
            userNameElement.textContent = user.full_name || user.email || 'User';
        }
    },

    // Path utilities
    getBasePath: function() {
        const path = window.location.pathname;
        if (path.includes('/projects/')) return '../';
        if (path.includes('/knowledge/')) return '../';
        if (path.includes('/recommendations/')) return '../';
        return '';
    },

    // Navigation utilities
    navigateTo: function(page) {
        window.location.href = this.getBasePath() + page;
    },

    // Event handler setup
    setupCommonEventListeners: function() {
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const userMenu = document.querySelector('.user-menu');
            const dropdown = document.getElementById('userDropdown');
            if (userMenu && dropdown && !userMenu.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Update user display on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.updateUserDisplay();
        });
    },

    // Alert utilities
    showAlert: function(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Find container to show alert in
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        // Remove alert after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
};

// Global function aliases for backward compatibility
function toggleUserMenu() {
    ExelokaCommon.toggleUserMenu();
}

function logout() {
    ExelokaCommon.logout();
}

// Initialize common functionality
ExelokaCommon.setupCommonEventListeners();