const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/pushSubscriptionModel');
const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, EMAIL_USER } = process.env;

// Set VAPID details for web-push
webpush.setVapidDetails(`mailto:${EMAIL_USER}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Enhanced subscribe route with mobile platform support
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId, platform, isPWA, userAgent, screenSize, timezone } = req.body;
    
    if (!subscription || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription and userId are required' 
      });
    }

    // Enhanced subscription object with mobile context
    const subscriptionData = {
      subscription,
      user: userId,
      platform: platform || 'unknown',
      isPWA: isPWA || false,
      userAgent: userAgent || 'unknown',
      screenSize: screenSize || { width: 0, height: 0 },
      timezone: timezone || 'UTC',
      createdAt: new Date(),
      isActive: true
    };

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      user: userId,
      'subscription.endpoint': subscription.endpoint
    });

    if (existingSubscription) {
      // Update existing subscription with new platform info
      await PushSubscription.findByIdAndUpdate(existingSubscription._id, {
        ...subscriptionData,
        updatedAt: new Date()
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Push subscription updated successfully',
        subscriptionId: existingSubscription._id
      });
    }

    // Create new subscription
    const newSubscription = await PushSubscription.create(subscriptionData);

    // Send welcome notification based on platform
    setTimeout(() => {
      sendWelcomeNotification(newSubscription);
    }, 2000);

    res.status(201).json({ 
      success: true, 
      message: 'Push subscription saved successfully',
      subscriptionId: newSubscription._id
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

// Send platform-specific welcome notification
async function sendWelcomeNotification(subscriptionDoc) {
  try {
    const { subscription, platform, isPWA } = subscriptionDoc;
    
    let welcomeMessage = {
      title: '🎉 Welcome to ZenList!',
      body: 'Push notifications are now enabled for your tasks',
      icon: '/zenList-192.png',
      badge: '/zenList-192.png',
      tag: 'welcome',
      data: {
        type: 'welcome',
        platform: platform,
        isPWA: isPWA,
        timestamp: Date.now()
      }
    };

    // Platform-specific customization
    if (platform === 'android') {
      welcomeMessage.vibrate = [300, 100, 300, 100, 300];
      welcomeMessage.color = '#1976d2';
      welcomeMessage.requireInteraction = true;
      welcomeMessage.actions = [
        { action: 'dismiss', title: 'Got it!' }
      ];
    } else if (platform === 'ios') {
      welcomeMessage.vibrate = [200, 100, 200];
      welcomeMessage.requireInteraction = false;
      if (isPWA) {
        welcomeMessage.body = 'Great! ZenList is now installed and ready to use offline';
      }
    }

    const payload = JSON.stringify(welcomeMessage);
    await webpush.sendNotification(subscription, payload);
    
    console.log('✅ Welcome notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending welcome notification:', error);
  }
}

// Enhanced unsubscribe route
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    
    if (!userId || !endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId and endpoint are required' 
      });
    }

    const deletedSubscription = await PushSubscription.findOneAndDelete({
      user: userId,
      'subscription.endpoint': endpoint
    });

    if (!deletedSubscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }

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

// Verify subscription endpoint
router.post('/verify', async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Endpoint is required' 
      });
    }

    const subscription = await PushSubscription.findOne({
      'subscription.endpoint': endpoint,
      isActive: true
    });

    res.json({ 
      success: true, 
      isValid: !!subscription,
      platform: subscription?.platform || 'unknown'
    });
  } catch (error) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify subscription' 
    });
  }
});

// Enhanced send notification with mobile optimization
router.post('/send', async (req, res) => {
  try {
    const { 
      userId, 
      title, 
      body, 
      data = {}, 
      actions = [], 
      image = null,
      requireInteraction = false,
      vibrate = [200, 100, 200]
    } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId, title, and body are required' 
      });
    }

    const subscriptions = await PushSubscription.find({ 
      user: userId, 
      isActive: true 
    });
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active subscriptions found for this user' 
      });
    }

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        // Create platform-specific notification
        const notificationData = createPlatformNotification(
          sub.platform, 
          title, 
          body, 
          data, 
          actions, 
          image, 
          requireInteraction, 
          vibrate
        );

        const payload = JSON.stringify(notificationData);
        await webpush.sendNotification(sub.subscription, payload);
        
        return { 
          success: true, 
          endpoint: sub.subscription.endpoint,
          platform: sub.platform
        };
      } catch (error) {
        console.error('Failed to send to:', sub.subscription.endpoint, error);
        
        // Handle invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndUpdate(sub._id, { 
            isActive: false,
            deactivatedAt: new Date(),
            deactivationReason: 'Invalid endpoint'
          });
        }
        
        return { 
          success: false, 
          endpoint: sub.subscription.endpoint, 
          error: error.message,
          platform: sub.platform
        };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    res.json({ 
      success: true, 
      message: `Notification sent to ${successCount}/${subscriptions.length} subscriptions`,
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

// Create platform-specific notification
function createPlatformNotification(platform, title, body, data, actions, image, requireInteraction, vibrate) {
  const baseNotification = {
    title,
    body,
    icon: '/zenList-192.png',
    badge: '/zenList-192.png',
    tag: `zenlist-${Date.now()}`,
    data: {
      ...data,
      platform,
      timestamp: Date.now()
    }
  };

  // Platform-specific enhancements
  switch (platform) {
    case 'android':
      return {
        ...baseNotification,
        vibrate: vibrate.length > 3 ? vibrate : [300, 100, 300, 100, 300],
        requireInteraction: requireInteraction || true,
        color: '#1976d2',
        actions: actions.slice(0, 3), // Android supports up to 3 actions
        image: image,
        silent: false,
        renotify: true
      };

    case 'ios':
      return {
        ...baseNotification,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        actions: actions.slice(0, 2), // iOS has limited action support
        silent: false,
        renotify: true
      };

    case 'desktop':
      return {
        ...baseNotification,
        vibrate: vibrate,
        requireInteraction: requireInteraction || false,
        actions: actions.slice(0, 3),
        image: image,
        silent: false,
        renotify: true
      };

    default:
      return {
        ...baseNotification,
        vibrate: vibrate,
        requireInteraction: requireInteraction || false,
        actions: actions.slice(0, 2),
        silent: false,
        renotify: true
      };
  }
}

// Send task reminder notification
router.post('/send-reminder', async (req, res) => {
  try {
    const { userId, taskId, taskTitle, dueDate } = req.body;
    
    if (!userId || !taskId || !taskTitle) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId, taskId, and taskTitle are required' 
      });
    }

    const subscriptions = await PushSubscription.find({ 
      user: userId, 
      isActive: true 
    });
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active subscriptions found' 
      });
    }

    const reminderData = {
      title: '⏰ Task Reminder',
      body: `Don't forget: ${taskTitle}`,
      data: {
        type: 'task-reminder',
        todoId: taskId,
        url: `/?todo=${taskId}`,
        dueDate: dueDate
      },
      actions: [
        { action: 'view', title: 'View Task' },
        { action: 'complete', title: 'Complete' },
        { action: 'snooze', title: 'Snooze' }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    };

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const notificationData = createPlatformNotification(
          sub.platform,
          reminderData.title,
          reminderData.body,
          reminderData.data,
          reminderData.actions,
          null,
          reminderData.requireInteraction,
          reminderData.vibrate
        );

        const payload = JSON.stringify(notificationData);
        await webpush.sendNotification(sub.subscription, payload);
        
        return { success: true, platform: sub.platform };
      } catch (error) {
        console.error('Failed to send reminder:', error);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    res.json({ 
      success: true, 
      message: `Reminder sent to ${successCount}/${subscriptions.length} devices`,
      results 
    });
  } catch (error) {
    console.error('Reminder send error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send reminder' 
    });
  }
});

// Get subscription analytics
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const subscriptions = await PushSubscription.find({ user: userId });
    
    const analytics = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.isActive).length,
      platformBreakdown: {},
      pwaUsers: subscriptions.filter(s => s.isPWA).length,
      lastActivity: subscriptions.reduce((latest, sub) => {
        const subDate = new Date(sub.updatedAt || sub.createdAt);
        return subDate > latest ? subDate : latest;
      }, new Date(0))
    };

    // Platform breakdown
    subscriptions.forEach(sub => {
      const platform = sub.platform || 'unknown';
      analytics.platformBreakdown[platform] = (analytics.platformBreakdown[platform] || 0) + 1;
    });

    res.json({ 
      success: true, 
      analytics 
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics' 
    });
  }
});

// Clean up inactive subscriptions
router.post('/cleanup', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await PushSubscription.deleteMany({
      isActive: false,
      deactivatedAt: { $lt: thirtyDaysAgo }
    });

    res.json({ 
      success: true, 
      message: `Cleaned up ${result.deletedCount} inactive subscriptions` 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cleanup subscriptions' 
    });
  }
});

module.exports = router;