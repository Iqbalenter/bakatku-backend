const { getDashboard } = require('./HandlerDashboard');
const express = require('express');
const router = express.Router();
const validateToken = require('../utils/validateToken');

router.get('/dashboard', validateToken, getDashboard);

module.exports = router;