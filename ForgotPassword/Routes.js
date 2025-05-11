const { ForgotPassword } = require('./HandlerForgot');
const express = require('express');
const router = express.Router();

router.post('/forgot-password', ForgotPassword);

module.exports = router;
