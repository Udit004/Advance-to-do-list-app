const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/pushSubscriptionModel');
const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, EMAIL_USER } = process.env;

// Set VAPID details for web-push
webpush.setVapidDetails(`mailto:${EMAIL_USER}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Subscribe route for push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    
    if (!subscription || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription and userId are required' 
      });
    }

    // Check if subscription already exists for this user
    const existingSubscription = await PushSubscription.findOne({
      user: userId,
      'subscription.endpoint': subscription.endpoint
    });

    if (existingSubscription) {
      return res.status(200).json({ 
        success: true, 
        message: 'Push subscription already exists' 
      });
    }

    // Create new subscription
    await PushSubscription.create({ 
      subscription, 
      user: userId 
    });

    res.status(201).json({ 
      success: true, 
      message: 'Push subscription saved successfully' 
    });
  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save subscription',
      error: error.message 
    });
  }
});

// Unsubscribe route
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    
    if (!userId || !endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId and endpoint are required' 
      });
    }

    await PushSubscription.findOneAndDelete({
      user: userId,
      'subscription.endpoint': endpoint
    });

    res.json({ 
      success: true, 
      message: 'Push subscription removed successfully' 
    });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove subscription' 
    });
  }
});

// Send test notification (for development)
router.post('/send-test', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId is required' 
      });
    }

    const subscriptions = await PushSubscription.find({ user: userId });
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No subscriptions found for this user' 
      });
    }

    const payload = JSON.stringify({
      title: title || 'Test Notification',
      body: body || 'This is a test notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        return { success: true, endpoint: sub.subscription.endpoint };
      } catch (error) {
        console.error('Failed to send to:', sub.subscription.endpoint, error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(sub._id);
        }
        
        return { success: false, endpoint: sub.subscription.endpoint, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    res.json({ 
      success: true, 
      message: `Test notification sent to ${successCount}/${subscriptions.length} subscriptions`,
      results 
    });
  } catch (error) {
    console.error('Push send error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send notification',
      error: error.message 
    });
  }
});

// Get all subscriptions for a user (for debugging)
router.get('/subscriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptions = await PushSubscription.find({ user: userId });
    
    res.json({ 
      success: true, 
      count: subscriptions.length,
      subscriptions: subscriptions.map(sub => ({
        id: sub._id,
        endpoint: sub.subscription.endpoint,
        createdAt: sub.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subscriptions' 
    });
  }
});

module.exports = router;