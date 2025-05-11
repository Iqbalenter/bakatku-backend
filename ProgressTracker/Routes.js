const { addProgress, updateProgressTitle } = require('./HandlerProgress');
const express = require('express');
const router = express.Router();
const validateToken = require('../utils/validateToken');

router.post('/progress', validateToken, addProgress);
router.put('/progress/update-title', validateToken, updateProgressTitle);

module.exports = router;