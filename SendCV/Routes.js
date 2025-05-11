const { sendCv, getSkillDetail } = require('./HandlerSendCV');
const express = require('express');
const router = express.Router();
const validateToken = require('../utils/validateToken');
const multer = require('multer');
const path = require('path');

// Setup multer langsung di sini
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
        return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
});

// Pastikan folder uploads ada
const fs = require('fs');
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Route untuk upload CV
router.post('/send-cv', validateToken, upload.single('file'), sendCv);
router.post('/get-skill-detail', validateToken, getSkillDetail);

module.exports = router;
