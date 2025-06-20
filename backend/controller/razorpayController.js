const Razorpay = require('razorpay');
const crypto = require('crypto');
const UserProfile = require('../models/userProfileModel');
const { log } = require('console');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY, // ✅ CORRECT!
});




const initiatePayment = async (req, res) => {
  try {
    const { amount, userId, plan } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ message: 'Amount and userId are required.' });
    }

    const options = {
      amount: parseInt(amount), // Ensure amount is a number in paise
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

const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    console.log('🔔 Webhook raw body:', req.body);
    console.log('🔐 Signature header:', signature);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const data = JSON.parse(req.body.toString());
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
