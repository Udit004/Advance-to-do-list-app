const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  endpoint: String,
  keys: {
    auth: String,
    p256dh: String
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
