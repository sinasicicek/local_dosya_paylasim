const API_BASE = '/api';

// DOM Elements
const fileList = document.getElementById('fileList');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const refreshBtn = document.getElementById('refreshBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const toast = document.getElementById('toast');

// State
let files = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchFiles();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // File input
    fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files));
    
    // Drop zone
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('dragover');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFileUpload(e.dataTransfer.files);
    });
    
    // Click on drop zone to trigger file input
    dropZone.addEventListener('click', () => fileInput.click());
    
    // Refresh button
    refreshBtn.addEventListener('click', fetchFiles);
}

// Fetch Files
async function fetchFiles() {
    try {
        fileList.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>Dosyalar yükleniyor...</span>
            </div>
        `;
        
        refreshBtn.disabled = true;
        
        const response = await fetch(`${API_BASE}/files`);
        if (!response.ok) throw new Error('Dosyalar alınamadı');

        files = await response.json();
        renderFiles();
    } catch (error) {
        fileList.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p class="empty-state-title">Bağlantı Hatası</p>
                <p class="empty-state-description">${escapeHtml(error.message)}</p>
            </div>
        `;
        showToast('Dosyalar yüklenemedi', 'error');
    } finally {
        refreshBtn.disabled = false;
    }
}

// Render Files
function renderFiles() {
    if (files.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p class="empty-state-title">Henüz dosya yok</p>
                <p class="empty-state-description">Dosya yüklemek için yukarıdaki alanı kullanın</p>
            </div>
        `;
        return;
    }

    fileList.innerHTML = files.map(file => `
        <div class="file-item">
            <div class="file-icon">${getFileIcon(file.name)}</div>
            <div class="file-info">
                <div class="file-name">${escapeHtml(file.name)}</div>
                <div class="file-meta">
                    ${formatFileSize(file.size)} · ${formatDate(file.modified)}
                </div>
            </div>
            <div class="file-actions">
                <button class="btn btn-outline btn-icon" onclick="downloadFile('${escapeHtml(file.name).replace(/'/g, "\\'")}')" title="İndir">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>
                <button class="btn btn-outline btn-icon" onclick="deleteFile('${escapeHtml(file.name).replace(/'/g, "\\'")}')" title="Sil">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Handle File Upload
async function handleFileUpload(fileList) {
    const uploadFiles = Array.from(fileList);

    if (uploadFiles.length === 0) return;

    for (const file of uploadFiles) {
        await uploadFile(file);
    }
}

// Upload File
async function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append('file', file);

        // Progress listener
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                showProgress(percent);
            }
        });

        // Load listener
        xhr.addEventListener('load', () => {
            hideProgress();
            if (xhr.status >= 200 && xhr.status < 300) {
                showToast(`${file.name} yüklendi`, 'success');
                fetchFiles();
                resolve();
            } else {
                showToast(`${file.name} yüklenemedi`, 'error');
                reject(new Error('Upload failed'));
            }
        });

        // Error listener
        xhr.addEventListener('error', () => {
            hideProgress();
            showToast(`${file.name} yüklenemedi`, 'error');
            reject(new Error('Upload error'));
        });

        xhr.open('POST', `${API_BASE}/upload`);
        xhr.send(formData);
    });
}

// Download File
function downloadFile(filename) {
    window.open(`${API_BASE}/download/${encodeURIComponent(filename)}`, '_blank');
}

// Delete File
async function deleteFile(filename) {
    if (!confirm(`"${filename}" dosyasını silmek istediğinize emin misiniz?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/files/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Silme başarısız');

        showToast(`${filename} silindi`, 'success');
        fetchFiles();
    } catch (error) {
        showToast(`Silme hatası: ${error.message}`, 'error');
    }
}

// Show Progress
function showProgress(percent) {
    progressContainer.style.display = 'flex';
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
}

// Hide Progress
function hideProgress() {
    progressContainer.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
}

// Show Toast
function showToast(message, type = '') {
    toast.innerHTML = `
        <svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${type === 'success' 
                ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                : type === 'error'
                ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
                : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
            }
        </svg>
        <span>${escapeHtml(message)}</span>
    `;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Get File Icon (SVG-based)
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const iconPaths = {
        pdf: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        doc: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        docx: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        txt: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        jpg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        jpeg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        png: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        gif: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        mp4: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
        avi: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
        mov: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
        mp3: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        wav: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        zip: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
        rar: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
        js: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2"><path d="M20 20.59c2.05-1.13 3.37-3.34 3.37-5.68 0-4.51-3.92-6.91-8.21-6.91-2.52 0-4.48 1.11-5.82 2.77L8.5 12.1c.98-1.12 2.41-1.97 4.4-1.97 2.54 0 3.85 1.35 3.85 3.51 0 2.33-1.69 3.49-3.61 4.5-2.46 1.3-4.8 2.19-4.8 4.63 0 1.63 1.25 3.25 3.61 3.25 2.33 0 3.83-.98 4.95-2.17l.84 1.67c-1.27 1.46-3.4 2.62-5.79 2.62-4.07 0-6.83-2.45-6.83-6.46 0-3.76 2.58-6.31 5.92-7.39z"/><path d="M3 12.91c1.13 2.05 3.34 3.37 5.68 3.37 4.51 0 6.91-3.92 6.91-8.21 0-2.52-1.11-4.48-2.77-5.82L11 1.5c1.12.98 1.97 2.41 1.97 4.4 0 2.54-1.35 3.85-3.51 3.85-2.33 0-3.49-1.69-4.5-3.61-1.3-2.46-2.19-4.8-4.63-4.8-1.63 0-3.25 1.25-3.25 3.61 0 2.33.98 3.83 2.17 4.95L1.5 11.2C0.04 12.47 0 14.5 0 17 0 21.07 2.45 23.83 6.46 23.83c3.76 0 6.31-2.58 7.39-5.92"/></svg>',
        ts: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3178c6" stroke-width="2"><path d="M20 20.59c2.05-1.13 3.37-3.34 3.37-5.68 0-4.51-3.92-6.91-8.21-6.91-2.52 0-4.48 1.11-5.82 2.77L8.5 12.1c.98-1.12 2.41-1.97 4.4-1.97 2.54 0 3.85 1.35 3.85 3.51 0 2.33-1.69 3.49-3.61 4.5-2.46 1.3-4.8 2.19-4.8 4.63 0 1.63 1.25 3.25 3.61 3.25 2.33 0 3.83-.98 4.95-2.17l.84 1.67c-1.27 1.46-3.4 2.62-5.79 2.62-4.07 0-6.83-2.45-6.83-6.46 0-3.76 2.58-6.31 5.92-7.39z"/><path d="M3 12.91c1.13 2.05 3.34 3.37 5.68 3.37 4.51 0 6.91-3.92 6.91-8.21 0-2.52-1.11-4.48-2.77-5.82L11 1.5c1.12.98 1.97 2.41 1.97 4.4 0 2.54-1.35 3.85-3.51 3.85-2.33 0-3.49-1.69-4.5-3.61-1.3-2.46-2.19-4.8-4.63-4.8-1.63 0-3.25 1.25-3.25 3.61 0 2.33.98 3.83 2.17 4.95L1.5 11.2C0.04 12.47 0 14.5 0 17 0 21.07 2.45 23.83 6.46 23.83c3.76 0 6.31-2.58 7.39-5.92"/></svg>',
        py: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3572A5" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 10c0-2 2-3 4-3s4 1 4 3"/><path d="M8 14c0 2 2 3 4 3s4-1 4-3"/></svg>',
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e34f26" stroke-width="2"><path d="M4 4l1.74 14.47L12 20l6.26-1.53L20 4H4z"/><path d="M12 4v12"/><path d="m8 8 4 1 4-1"/></svg>',
        css: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1572b6" stroke-width="2"><path d="M4 4l1.74 14.47L12 20l6.26-1.53L20 4H4z"/><path d="M12 4v12"/><path d="m8 8 4 1 4-1"/></svg>',
        default: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
    };
    
    return iconPaths[ext] || iconPaths.default;
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
