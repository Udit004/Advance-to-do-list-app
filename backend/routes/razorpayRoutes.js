// routes/razorpayRoutes.js
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { initiatePayment, handleWebhook } = require('../controller/razorpayController');

router.post('/initiate-payment', initiatePayment);

// Raw body parser only for webhook
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
