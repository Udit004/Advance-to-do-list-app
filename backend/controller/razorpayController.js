const Razorpay = require('razorpay');
const crypto = require('crypto');
const UserProfile = require('../models/userProfileModel');

// Initialize Razorpay instance with your secret credentials
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Route: POST /api/razorpay/initiate-payment
const initiatePayment = async (req, res) => {
  try {
    const { amount, userId, plan } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ message: 'Amount and userId are required.' });
    }

    const options = {
      amount, // amount in paise (e.g., 999 means ₹9.99)
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        userId,
        plan: plan || 'basic',
      },
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send('Order creation failed.');

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Payment initiation error:', error.message);
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
};

// Route: POST /api/razorpay/webhook
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const body = req.body; // raw body expected via bodyParser.raw
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const data = JSON.parse(body.toString()); // Convert raw buffer to JSON object
    console.log('✅ Valid webhook received:', data.event);

    if (data.event === 'payment.captured') {
      const payment = data.payload.payment.entity;
      const userId = payment.notes?.userId;

      if (userId) {
        await UserProfile.findByIdAndUpdate(userId, { isPaid: true });
        console.log(`✅ User ${userId} is now marked as paid.`);
      } else {
        console.warn('⚠️ No userId found in payment notes.');
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook handling failed', error: error.message });
  }
};

module.exports = { initiatePayment, handleWebhook };
