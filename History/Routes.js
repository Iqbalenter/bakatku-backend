const { getHistory, getHistoryDetail } = require('./HandlerHistory');
const express = require('express');
const router = express.Router();
const validateToken = require('../utils/validateToken');

router.get('/history', validateToken, getHistory);
router.post('/history/detail', validateToken, getHistoryDetail);

module.exports = router;