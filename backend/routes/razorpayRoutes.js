const express = require('express');
const router = express.Router();
const { initiatePayment, handleWebhook } = require('../controller/razorpayController');

router.post('/initiate-payment', initiatePayment);


module.exports = router;