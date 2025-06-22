// routes/razorpayRoutes.js
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { initiatePayment, handleWebhook } = require('../controller/razorpayController');

// Regular JSON parsing for payment initiation
router.post('/initiate-payment', initiatePayment);

// Raw body parser specifically for webhook - this must come before any other body parsing
router.post('/webhook', 
  bodyParser.raw({ 
    type: 'application/json',
    limit: '1mb' // Set a reasonable limit
  }), 
  handleWebhook
);

module.exports = router;