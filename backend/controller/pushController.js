const Subscription = require('../models/pushSubscriptionModel');

const saveSubscription = async (req, res) => {
  const { userId, subscription } = req.body;

  try {
    await Subscription.findOneAndUpdate(
      { userId, endpoint: subscription.endpoint },
      subscription,
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Subscription saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { saveSubscription };
