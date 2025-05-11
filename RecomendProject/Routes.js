const { GetProjectRecommendations } = require('./HandlerRecomend');
const express = require('express');
const router = express.Router();
const validateToken = require('../utils/validateToken');

router.get('/recomend-project', validateToken, GetProjectRecommendations);

module.exports = router;