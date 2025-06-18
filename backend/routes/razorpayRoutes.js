const express = require('express');
const router = express.Router();
const { initiatePayment, handleWebhook } = require('../controller/razorpayController');

router.post('/initiate-payment', initiatePayment);
router.post('/webhook', handleWebhook);

module.exports = router;