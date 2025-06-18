const razorpayConfig = require('../config/razorpay');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const razorpayConfig = require('../config/razorpay');
const UserProfile = require('../models/userProfileModel');

const initiatePayment = async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: razorpayConfig.RAZORPAY_API_KEY,
            key_secret: razorpayConfig.RAZORPAY_SECRET_KEY,
        });

        const options = {
            amount: req.body.amount, // amount in the smallest currency unit
            currency: 'INR',
            receipt: 'receipt_order_7439',
            notes: {
                userId: req.body.userId, // Pass userId from frontend
            },
        };

        const order = await instance.orders.create(options);

        if (!order) return res.status(500).send('Some error occurred');

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ message: 'Payment initiation failed', error: error.message });
    }
};

const handleWebhook = async (req, res) => {
    try {
        console.log('Webhook received:', JSON.stringify(req.body, null, 2));
        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        shasum.update(req.body);
        const digest = shasum.digest('hex');

        console.log('Calculated digest:', digest);
        console.log('Received signature:', req.headers['x-razorpay-signature']);

        if (digest === req.headers['x-razorpay-signature']) {
            console.log('Request is legit');
            // Process the payment
            const { event, payload: razorpayPayload } = JSON.parse(req.body.toString());
            if (event === 'payment.captured') {
                console.log('Payment captured event received.');
                const payment = razorpayPayload.payment.entity;
                const userId = payment.notes.userId;
                console.log(`Attempting to update user ${userId} with isPaid: true.`);
                await UserProfile.findByIdAndUpdate(userId, { isPaid: true });
                console.log(`User ${userId} is now a paid user.`);
            }
        } else {
            console.log('Request is not legit');
        }
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ message: 'Webhook handling failed', error: error.message });
    }
};

module.exports = { initiatePayment, handleWebhook };