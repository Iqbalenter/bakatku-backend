const { GetSkillDevelopment } = require('./HandlerSkill');
const express = require('express');
const router = express.Router();
const validateToken = require('../utils/validateToken');

router.get('/skill-development', validateToken, GetSkillDevelopment);

module.exports = router;
