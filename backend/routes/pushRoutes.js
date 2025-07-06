const express = require('express');
const router = express.Router();
const { saveSubscription } = require('../controller/pushController');

router.post('/save-subscription', saveSubscription);

module.exports = router;
