const Razorpay = require('razorpay');
const crypto = require('crypto');
const UserProfile = require('../models/userProfileModel');
const { log } = require('console');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
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

    console.log('🔔 Webhook received');
    console.log('🔐 Signature header:', signature);
    console.log('📦 Raw body type:', typeof req.body);
    console.log('📦 Raw body length:', req.body?.length);

    // Verify webhook secret exists
    if (!webhookSecret) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET is not set');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    // Verify signature exists
    if (!signature) {
      console.error('❌ No signature header found');
      return res.status(400).json({ message: 'No signature header' });
    }

    // Create expected signature using raw body
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body, 'utf8') // Ensure UTF-8 encoding
      .digest('hex');

    console.log('🔍 Expected signature:', expectedSignature);
    console.log('🔍 Received signature:', signature);

    // Compare signatures securely
    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValidSignature) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Parse the webhook data
    let data;
    try {
      data = JSON.parse(req.body.toString());
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError.message);
      return res.status(400).json({ message: 'Invalid JSON payload' });
    }

    console.log('✅ Valid webhook received:', data.event);
    console.log('📋 Webhook payload:', JSON.stringify(data, null, 2));

    // Handle different webhook events
    if (data.event === 'payment.captured') {
      const payment = data.payload.payment.entity;
      const userId = payment.notes?.userId;
      
      console.log('💰 Payment captured event');
      console.log('👤 User ID from notes:', userId);
      console.log('💵 Payment amount:', payment.amount);
      console.log('📝 Payment notes:', payment.notes);
    
      if (userId) {
        try {
          console.log(`🔄 Attempting to update user with UID: ${userId}`);
          
          const updatedUser = await UserProfile.findOneAndUpdate(
            { uid: userId },
            { 
              isPaid: true,
              paymentId: payment.id,
              paymentDate: new Date()
            },
            { new: true }
          );
    
          if (updatedUser) {
            console.log(`✅ User with UID ${userId} is now marked as paid.`);
            console.log('👤 Updated user:', {
              id: updatedUser._id,
              uid: updatedUser.uid,
              email: updatedUser.email,
              isPaid: updatedUser.isPaid
            });
          } else {
            console.warn(`⚠️ No user found in DB with UID: ${userId}`);
            
            // Try to find user by different criteria for debugging
            const userCheck = await UserProfile.findOne({ uid: userId });
            console.log('🔍 User lookup result:', userCheck);
            
            if (!userCheck) {
              console.log('🔍 Checking all users in DB...');
              const allUsers = await UserProfile.find({}, { uid: 1, email: 1 });
              console.log('👥 All users:', allUsers);
            }
          }
        } catch (err) {
          console.error('❌ Error updating user payment status:', err.message);
          console.error('❌ Full error:', err);
        }
      } else {
        console.warn('⚠️ No userId found in payment notes.');
        console.warn('📝 Available notes:', payment.notes);
      }
    } else if (data.event === 'payment.failed') {
      console.log('❌ Payment failed event received');
      const payment = data.payload.payment.entity;
      console.log('💳 Failed payment details:', {
        id: payment.id,
        amount: payment.amount,
        error: payment.error_description
      });
    } else {
      console.log(`ℹ️ Unhandled webhook event: ${data.event}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Webhook handling failed', error: error.message });
  }
};

module.exports = { initiatePayment, handleWebhook };