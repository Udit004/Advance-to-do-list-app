const Razorpay = require('razorpay');
const crypto = require('crypto');
const UserProfile = require('../models/userProfileModel');

const initiatePayment = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });

    const options = {
      amount: req.body.amount, // amount in paise
      currency: 'INR',
      receipt: 'receipt_order_7439',
      notes: {
        userId: req.body.userId,
        plan: req.body.plan || "Pro",
      },
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send('Something went wrong');

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const razorpaySignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_SECRET_KEY;

    const body = req.body; // raw Buffer (because of express.raw middleware)

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpaySignature) {
      console.log('✅ Webhook verified');
      const payload = JSON.parse(body.toString());

      const { event, payload: razorpayPayload } = payload;

      if (event === 'payment.captured') {
        const payment = razorpayPayload.payment.entity;
        const userId = payment.notes.userId;
        console.log(`🔁 Updating user ${userId} to paid`);
        await UserProfile.findByIdAndUpdate(userId, { isPaid: true });
        console.log(`✅ User ${userId} is now a paid user`);
      }
    } else {
      console.warn('⚠️ Invalid webhook signature');
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({ message: 'Webhook handling failed', error: error.message });
  }
};

module.exports = { initiatePayment, handleWebhook };
