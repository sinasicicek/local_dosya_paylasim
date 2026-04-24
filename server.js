const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Sanitize filename
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, sanitized);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});

// File list helper
function getFiles() {
    return new Promise((resolve, reject) => {
        fs.readdir(UPLOAD_DIR, (err, files) => {
            if (err) return reject(err);

            const fileInfos = files.map(file => {
                const filePath = path.join(UPLOAD_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                };
            });

            // Sort by modified date (newest first)
            fileInfos.sort((a, b) => new Date(b.modified) - new Date(a.modified));
            resolve(fileInfos);
        });
    });
}

// API Routes

// Get file list
app.get('/api/files', async (req, res) => {
    try {
        const files = await getFiles();
        res.json(files);
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Dosyalar listelenemedi' });
    }
});

// Upload file(s)
app.post('/api/upload', upload.array('file', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Dosya seçilmedi' });
        }
        res.json({
            message: `${req.files.length} dosya yüklendi`,
            files: req.files.map(f => f.filename)
        });
    } catch (error) {
        console.error('Error uploading:', error);
        res.status(500).json({ error: 'Yükleme başarısız' });
    }
});

// Download file
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Security check
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Geçersiz dosya adı' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    res.download(filePath, filename);
});

// Delete file
app.delete('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Security check
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Geçersiz dosya adı' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({ message: 'Dosya silindi' });
    } catch (error) {
        console.error('Error deleting:', error);
        res.status(500).json({ error: 'Silme başarısız' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
    console.log(`Dosyalar burada saklanıyor: ${UPLOAD_DIR}`);
});