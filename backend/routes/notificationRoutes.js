const express = require("express");
const router = express.Router();
const Notification = require("../models/notificationModel");

// Get all notifications for a user
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.params.userId,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a notification as read
router.put("/read/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Test notification route - this should be in your main app.js or server.js, not in routes
// Move this to your main server file where you have access to the app instance
router.get("/test/:userId", (req, res) => {
  const { userId } = req.params;

  const testNotification = {
    _id: "test-" + Date.now(),
    user: userId,
    message: "Test notification from server",
    type: "test",
    read: false,
    createdAt: new Date(),
  };

  try {
    const { sendNotificationToUser } = require("../socket"); // Adjust path as needed
    sendNotificationToUser(userId, testNotification);

    res.json({
      success: true,
      message: "Test notification sent",
      notification: testNotification,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
      error: error.message,
    });
  }
});

module.exports = router;