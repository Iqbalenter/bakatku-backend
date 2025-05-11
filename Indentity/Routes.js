const express = require('express');
const router = express.Router();
const { fillUserIdentity, getUserIdentity } = require('./HandlerIndentity');
const validateToken = require('../utils/validateToken');

router.post('/user/identity', validateToken, fillUserIdentity);
router.get('/user/identity/me', validateToken, getUserIdentity);

module.exports = router;