// routes/aiRoutes.js

const express = require('express');
const router = express.Router();
const { aiPromptHandler } = require('../controller/aiController');

// POST /api/ai
router.post('/', aiPromptHandler);

module.exports = router;
