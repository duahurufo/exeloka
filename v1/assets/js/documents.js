/**
 * Exeloka v1 - Document Management
 * Secure file upload and document handling
 */

class DocumentsManager {
    constructor() {
        this.documents = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.filters = {
            type: 'all',
            search: ''
        };
        this.uploadQueue = [];
        this.isUploading = false;
    }

    static init() {
        const manager = new DocumentsManager();
        manager.setupEventListeners();
        manager.loadDocuments();
        return manager;
    }

    setupEventListeners() {
        // File upload handlers
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Manual document form
        const manualForm = document.getElementById('manualDocForm');
        manualForm.addEventListener('submit', this.handleManualSubmit.bind(this));

        // Filters
        document.getElementById('typeFilter').addEventListener('change', this.handleFilterChange.bind(this));
        document.getElementById('searchFilter').addEventListener('input', this.debounce(this.handleFilterChange.bind(this), 300));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        if (this.isUploading) {
            this.showNotification('Upload sedang berlangsung, harap tunggu...', 'warning');
            return;
        }

        const validFiles = this.validateFiles(files);
        if (validFiles.length === 0) return;

        this.uploadQueue = validFiles;
        await this.uploadFiles();
    }

    validateFiles(files) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        const maxSize = 50 * 1024 * 1024; // 50MB
        const validFiles = [];

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                this.showNotification(`File ${file.name} tidak didukung`, 'error');
                continue;
            }
            if (file.size > maxSize) {
                this.showNotification(`File ${file.name} terlalu besar (max 50MB)`, 'error');
                continue;
            }
            validFiles.push(file);
        }

        return validFiles;
    }

    async uploadFiles() {
        this.isUploading = true;
        this.showUploadProgress(0);

        let uploaded = 0;
        const total = this.uploadQueue.length;

        for (const file of this.uploadQueue) {
            try {
                await this.uploadFile(file);
                uploaded++;
                this.showUploadProgress((uploaded / total) * 100);
            } catch (error) {
                console.error('Upload error:', error);
                this.showNotification(`Gagal upload ${file.name}: ${error.message}`, 'error');
            }
        }

        this.hideUploadProgress();
        this.isUploading = false;
        this.uploadQueue = [];

        if (uploaded > 0) {
            this.showNotification(`${uploaded} file berhasil diupload`, 'success');
            this.loadDocuments(); // Refresh list
        }
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('context', 'user_files');

        const response = await fetch('api/documents.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        return result;
    }

    async handleManualSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('docTitle').value.trim();
        const content = document.getElementById('docContent').value.trim();
        const description = document.getElementById('docDescription').value.trim();
        const tags = document.getElementById('docTags').value.split(',').map(tag => tag.trim()).filter(Boolean);

        if (!title || !content) {
            this.showNotification('Judul dan konten harus diisi', 'error');
            return;
        }

        try {
            const response = await fetch('api/documents.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create_manual',
                    title,
                    content,
                    description,
                    tags
                }),
                credentials: 'same-origin'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create document');
            }

            this.showNotification('Dokumen berhasil dibuat', 'success');
            e.target.reset();
            this.loadDocuments();

        } catch (error) {
            console.error('Manual document error:', error);
            this.showNotification('Gagal membuat dokumen: ' + error.message, 'error');
        }
    }

    async loadDocuments() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 12,
                type: this.filters.type,
                filter: this.filters.search
            });

            const response = await fetch(`api/documents.php?${params}`, {
                credentials: 'same-origin'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to load documents');
            }

            this.documents = result.documents || [];
            this.totalPages = result.pagination.total_pages || 1;
            this.renderDocuments();
            this.renderPagination();

        } catch (error) {
            console.error('Load documents error:', error);
            this.showNotification('Gagal memuat dokumen', 'error');
            this.renderDocuments([]); // Show empty state
        }
    }

    renderDocuments(documents = this.documents) {
        const container = document.getElementById('documentsList');
        
        if (documents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📄</div>
                    <h3>Belum ada dokumen</h3>
                    <p>Upload atau buat dokumen pertama Anda</p>
                </div>
            `;
            return;
        }

        const html = documents.map(doc => {
            const icon = this.getFileIcon(doc.mime_type);
            const isManual = doc.storage_type === 'manual';
            
            return `
                <div class="document-card" data-id="${doc.id}">
                    <div class="document-icon">${icon}</div>
                    <div class="document-info">
                        <h3 class="document-title">${this.escapeHtml(doc.original_name)}</h3>
                        <p class="document-meta">
                            ${doc.file_size_formatted} • ${this.formatDate(doc.created_at)}
                            ${isManual ? ' • Manual' : ''}
                        </p>
                        <div class="document-badges">
                            ${doc.project_count > 0 ? `<span class="badge badge-blue">${doc.project_count} Proyek</span>` : ''}
                            ${doc.knowledge_count > 0 ? `<span class="badge badge-green">${doc.knowledge_count} Knowledge</span>` : ''}
                        </div>
                    </div>
                    <div class="document-actions">
                        <button onclick="DocumentsManager.viewDocument(${doc.id})" class="btn-icon" title="Lihat">👁️</button>
                        ${!isManual ? `<button onclick="DocumentsManager.downloadDocument(${doc.id})" class="btn-icon" title="Download">⬇️</button>` : ''}
                        <button onclick="DocumentsManager.deleteDocument(${doc.id})" class="btn-icon btn-danger" title="Hapus">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    renderPagination() {
        const container = document.getElementById('pagination');
        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const buttons = [];
        
        // Previous button
        if (this.currentPage > 1) {
            buttons.push(`<button onclick="DocumentsManager.goToPage(${this.currentPage - 1})" class="pagination-btn">‹</button>`);
        }

        // Page numbers
        const start = Math.max(1, this.currentPage - 2);
        const end = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = start; i <= end; i++) {
            const active = i === this.currentPage ? 'active' : '';
            buttons.push(`<button onclick="DocumentsManager.goToPage(${i})" class="pagination-btn ${active}">${i}</button>`);
        }

        // Next button
        if (this.currentPage < this.totalPages) {
            buttons.push(`<button onclick="DocumentsManager.goToPage(${this.currentPage + 1})" class="pagination-btn">›</button>`);
        }

        container.innerHTML = `<div class="pagination">${buttons.join('')}</div>`;
    }

    static goToPage(page) {
        const instance = window.documentsManagerInstance;
        if (instance) {
            instance.currentPage = page;
            instance.loadDocuments();
        }
    }

    handleFilterChange() {
        this.filters.type = document.getElementById('typeFilter').value;
        this.filters.search = document.getElementById('searchFilter').value;
        this.currentPage = 1;
        this.loadDocuments();
    }

    static async viewDocument(id) {
        try {
            const response = await fetch(`api/documents.php?id=${id}`, {
                credentials: 'same-origin'
            });
            
            const doc = await response.json();
            if (!response.ok) {
                throw new Error(doc.error || 'Failed to load document');
            }

            // Show document details in modal
            document.getElementById('modalTitle').textContent = doc.original_name;
            document.getElementById('modalBody').innerHTML = `
                <div class="document-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Ukuran File:</label>
                            <span>${doc.file_size_formatted}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tipe:</label>
                            <span>${doc.mime_type}</span>
                        </div>
                        <div class="detail-item">
                            <label>Dibuat:</label>
                            <span>${new Date(doc.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div class="detail-item">
                            <label>Diakses:</label>
                            <span>${doc.last_accessed ? new Date(doc.last_accessed).toLocaleDateString('id-ID') : 'Belum pernah'}</span>
                        </div>
                    </div>
                    ${doc.extracted_text ? `
                        <div class="extracted-text">
                            <label>Konten Teks:</label>
                            <div class="text-content">${doc.extracted_text.substring(0, 500)}${doc.extracted_text.length > 500 ? '...' : ''}</div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('documentModal').classList.remove('hidden');

        } catch (error) {
            console.error('View document error:', error);
            const instance = window.documentsManagerInstance;
            if (instance) {
                instance.showNotification('Gagal memuat detail dokumen', 'error');
            }
        }
    }

    static async downloadDocument(id) {
        window.open(`api/documents.php?id=${id}&download=1`, '_blank');
    }

    static async deleteDocument(id) {
        if (!confirm('Yakin ingin menghapus dokumen ini?')) return;

        try {
            const response = await fetch(`api/documents.php?id=${id}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete document');
            }

            const instance = window.documentsManagerInstance;
            if (instance) {
                instance.showNotification('Dokumen berhasil dihapus', 'success');
                instance.loadDocuments();
            }

        } catch (error) {
            console.error('Delete document error:', error);
            const instance = window.documentsManagerInstance;
            if (instance) {
                instance.showNotification('Gagal menghapus dokumen: ' + error.message, 'error');
            }
        }
    }

    showUploadProgress(percent) {
        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressContainer.classList.remove('hidden');
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `Uploading... ${Math.round(percent)}%`;
    }

    hideUploadProgress() {
        document.getElementById('uploadProgress').classList.add('hidden');
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel')) return '📊';
        if (mimeType.includes('powerpoint')) return '📑';
        if (mimeType.includes('text')) return '📄';
        return '📎';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions for static calls
window.closeModal = function() {
    document.getElementById('documentModal').classList.add('hidden');
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.documentsManagerInstance = DocumentsManager.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentsManager;
}