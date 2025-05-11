const { GetDataSkill } = require('./HandlerSkill');
const express = require('express');
const router = express.Router();

router.get('/skill', GetDataSkill);

module.exports = router;