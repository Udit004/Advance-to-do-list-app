// routes/razorpayRoutes.js
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { initiatePayment, handleWebhook } = require('../controller/razorpayController');

// JSON parsing specifically for payment initiation
router.post('/initiate-payment', 
  bodyParser.json(), 
  initiatePayment
);

// Raw body parser specifically for webhook
router.post('/webhook', 
  bodyParser.raw({ 
    type: 'application/json',
    limit: '1mb'
  }), 
  handleWebhook
);

module.exports = router;