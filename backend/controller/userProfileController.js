const userProfile = require("../models/userProfileModel");
const Notification = require("../models/notificationModel");
const PushSubscription = require("../models/pushSubscriptionModel");
const transporter = require("../config/email");
const { sendNotificationToUser } = require("../socket");
const webpush = require("web-push");
const { EMAIL_USER, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;

// Set web-push credentials
webpush.setVapidDetails(
  `mailto:${EMAIL_USER}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Utility function: Send push notification
const sendPushNotifications = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });

    if (subscriptions.length === 0) {
      console.log("No push subscriptions found for user:", userId);
      return;
    }

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify(payload)
        );
        console.log(
          "Push notification sent successfully to:",
          sub.subscription.endpoint
        );
      } catch (error) {
        console.error(
          "Push notification failed for:",
          sub.subscription.endpoint,
          error.message
        );

        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(sub._id);
          console.log("Removed invalid subscription:", sub._id);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("Error in sendPushNotifications:", error);
  }
};

// Utility function: Send email notification
const sendEmailNotification = async (userEmail, subject, htmlContent) => {
  try {
    console.log("Attempting to send email to:", userEmail);
    console.log("Email transporter available:", !!transporter);
    console.log("EMAIL_USER configured:", !!EMAIL_USER);

    if (!userEmail || !transporter) {
      console.log("Email notification skipped - missing email or transporter");
      return { success: false, reason: "Missing email or transporter" };
    }

    const mailOptions = {
      from: EMAIL_USER,
      to: userEmail,
      subject,
      html: htmlContent,
    };

    console.log("Sending email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log("Email notification sent successfully to:", userEmail);
    console.log("Email result:", result);

    return { success: true, result };
  } catch (error) {
    console.error("Email notification failed:", error);
    return { success: false, error: error.message };
  }
};

// Utility function: Send complete notification (Socket.IO + Push + Email)
// Utility function: Send complete notification (Socket.IO + Push + Email)
const sendCompleteNotification = async (
  userId,
  notificationData,
  emailData = null
) => {
  try {
    console.log("Starting sendCompleteNotification for user:", userId);
    console.log("Notification data:", notificationData);
    console.log("Email data:", emailData);

    // Validate userId
    if (!userId) {
      console.error("No userId provided for notification");
      return null;
    }

    // Build the query object that matches your unique index
    const queryObject = {
      user: userId,
      type: notificationData.type,
    };

    // Add todoId to query if it exists in notificationData, otherwise set to null
    if (notificationData.todoId) {
      queryObject.todoId = notificationData.todoId;
    } else {
      queryObject.todoId = null;
    }

    console.log("Query object for existing notification:", queryObject);

    // Check if notification already exists to prevent duplicates
    const existingNotification = await Notification.findOne(queryObject);

    let notification;
    if (existingNotification) {
      // Update existing notification
      notification = await Notification.findByIdAndUpdate(
        existingNotification._id,
        {
          message: notificationData.message,
          read: false,
          updatedAt: new Date(),
        },
        { new: true }
      );
      console.log("Updated existing notification:", notification._id);
    } else {
      // Create new notification - make sure to include all fields for the unique index
      const newNotificationData = {
        user: userId,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        todoId: notificationData.todoId || null, // Explicitly set todoId
      };

      console.log("Creating new notification with data:", newNotificationData);

      try {
        notification = await Notification.create(newNotificationData);
        console.log("Created new notification:", notification._id);
      } catch (createError) {
        console.error("Error creating notification:", createError);

        // If it's a duplicate key error, try to find and update the existing one
        if (createError.code === 11000) {
          console.log(
            "Duplicate key error, trying to update existing notification"
          );

          // Try to find the existing notification and update it
          const existingNotif = await Notification.findOneAndUpdate(
            queryObject,
            {
              message: notificationData.message,
              read: false,
              updatedAt: new Date(),
            },
            { new: true, upsert: false }
          );

          if (existingNotif) {
            notification = existingNotif;
            console.log(
              "Updated existing notification after duplicate error:",
              notification._id
            );
          } else {
            console.error("Could not find existing notification to update");
            return null;
          }
        } else {
          throw createError; // Re-throw if it's not a duplicate key error
        }
      }
    }

    if (!notification) {
      console.error("Failed to create or update notification");
      return null;
    }

    // Send real-time notification via Socket.IO
    try {
      const socketData = {
        _id: notification._id,
        user: userId,
        userId: userId, // Add both for compatibility
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        createdAt: notification.createdAt,
        todoId: notification.todoId,
      };

      console.log("Sending socket notification:", socketData);
      const socketResult = sendNotificationToUser(userId, socketData);

      if (socketResult) {
        console.log("Socket notification sent successfully");
      } else {
        console.log("Socket notification failed or no clients connected");
      }
    } catch (socketError) {
      console.error("Socket notification failed:", socketError);
    }

    // Send push notification
    if (notificationData.pushPayload) {
      try {
        console.log("Sending push notification...");
        await sendPushNotifications(userId, notificationData.pushPayload);
        console.log("Push notification sent successfully");
      } catch (pushError) {
        console.error("Push notification failed:", pushError);
      }
    }

    // Send email notification
    if (emailData) {
      try {
        console.log("Sending email notification...");
        const emailResult = await sendEmailNotification(
          emailData.email,
          emailData.subject,
          emailData.htmlContent
        );
        console.log("Email notification result:", emailResult);
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }

    return notification;
  } catch (error) {
    console.error("Error in sendCompleteNotification:", error);
    // Don't throw error for notification failures - continue with main operation
    return null;
  }
};
exports.createUserProfile = async (req, res) => {
  try {
    const profileData = { ...req.body };

    console.log("Creating user profile with data:", profileData);

    if (req.file && req.file.path) {
      profileData.profileImage = req.file.path;
    }

    delete profileData._id;
    const newProfile = new userProfile(profileData);
    const savedProfile = await newProfile.save();

    console.log("Profile created successfully:", savedProfile);

    // Send welcome notifications - Make sure uid exists
    if (savedProfile.uid && savedProfile.email) {
      console.log("Sending welcome notifications for user:", savedProfile.uid);

      const welcomeEmailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Welcome to TodoApp! 🎉</h2>
            <p>Hi ${savedProfile.name || "there"},</p>
            <p>Thank you for creating your profile with TodoApp. We're excited to have you on board!</p>
            <p>Your profile has been successfully created with the following details:</p>
            <ul>
              <li><strong>Name:</strong> ${
                savedProfile.name || "Not provided"
              }</li>
              <li><strong>Email:</strong> ${savedProfile.email}</li>
              <li><strong>Username:</strong> ${
                savedProfile.username || "Not provided"
              }</li>
            </ul>
            <p>You can now start organizing your tasks and boosting your productivity!</p>
            <p>If you have any questions or need assistance, feel free to reach out to us.</p>
            <p>Happy organizing!</p>
            <p>Best regards,<br>The TodoApp Team</p>
          </div>
        `;

      const message = `Welcome to TodoApp! Your profile has been created successfully.`;

      // Send complete notification (Socket.IO + Push + Email)
      try {
        const notificationResult = await sendCompleteNotification(
          savedProfile.uid,
          {
            message,
            type: "profile_created",
            todoId: null, // Explicitly set for profile notifications
            pushPayload: {
              title: "Welcome to TodoApp! 🎉",
              body: message,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              data: { type: "profile_created" },
            },
          },
          {
            email: savedProfile.email,
            subject: "Welcome to TodoApp - Profile Created Successfully!",
            htmlContent: welcomeEmailContent,
          }
        );
        console.log("Welcome notification sent, result:", notificationResult);
      } catch (notificationError) {
        console.error("Welcome notification error:", notificationError);
      }
    } else {
      console.log("Skipping welcome notifications - missing uid or email");
      console.log("uid:", savedProfile.uid, "email:", savedProfile.email);
    }

    res.status(201).json(savedProfile);
  } catch (error) {
    console.error("Error creating user profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Searching for profile with ID:", id);

    // Try to find by uid first (preferred method)
    let profile = await userProfile.findOne({ uid: id });

    // If not found by uid, try finding by MongoDB _id
    if (!profile) {
      console.log("Profile not found by uid, trying _id");
      try {
        profile = await userProfile.findById(id);
      } catch (err) {
        // If _id format is invalid, this will throw an error
        console.log("Invalid _id format:", err.message);
      }
    }

    if (!profile) {
      console.log("Profile not found with any method for ID:", id);
      return res.status(404).json({
        error: "Profile not found",
        searchedId: id,
        message: "No profile found with the provided identifier",
      });
    }

    console.log("Profile found:", profile._id, "for uid:", profile.uid);
    res.json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = { ...req.body };

    console.log("Updating profile for ID:", id);
    console.log("Update data:", profileData);

    if (req.file && req.file.path) {
      profileData.profileImage = req.file.path;
    }

    delete profileData._id;

    // Get the old profile data first to compare changes
    let oldProfile = await userProfile.findById(id);
    if (!oldProfile) {
      oldProfile = await userProfile.findOne({ uid: id });
    }

    if (!oldProfile) {
      return res.status(404).json({
        error: "Profile not found",
        searchedId: id,
        message: "No profile found with the provided identifier for update",
      });
    }

    console.log("Found old profile:", oldProfile._id);

    // Try to update by MongoDB _id first (since this is an update operation)
    let updatedProfile = await userProfile.findByIdAndUpdate(
      oldProfile._id,
      profileData,
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        error: "Profile update failed",
        searchedId: id,
        message: "Failed to update profile",
      });
    }

    console.log("Profile updated successfully:", updatedProfile._id);

    // Send profile update notifications if email exists and uid is available
    if (updatedProfile.email && updatedProfile.uid) {
      const changedFields = [];

      // Helper function to safely compare values
      const hasChanged = (oldValue, newValue) => {
        // Handle null/undefined cases
        if (oldValue == null && newValue == null) return false;
        if (oldValue == null || newValue == null) return true;

        // Convert to strings for comparison to handle different types
        return String(oldValue).trim() !== String(newValue).trim();
      };

      // Check what fields were changed - more comprehensive check
      if (hasChanged(oldProfile.name, updatedProfile.name)) {
        changedFields.push("Name");
        console.log(
          "Name changed:",
          oldProfile.name,
          "->",
          updatedProfile.name
        );
      }

      if (hasChanged(oldProfile.username, updatedProfile.username)) {
        changedFields.push("Username");
        console.log(
          "Username changed:",
          oldProfile.username,
          "->",
          updatedProfile.username
        );
      }

      if (hasChanged(oldProfile.email, updatedProfile.email)) {
        changedFields.push("Email");
        console.log(
          "Email changed:",
          oldProfile.email,
          "->",
          updatedProfile.email
        );
      }

      if (hasChanged(oldProfile.profileImage, updatedProfile.profileImage)) {
        changedFields.push("Profile Image");
        console.log(
          "Profile Image changed:",
          oldProfile.profileImage,
          "->",
          updatedProfile.profileImage
        );
      }

      // Check for other common fields that might exist in your schema
      if (hasChanged(oldProfile.bio, updatedProfile.bio)) {
        changedFields.push("Bio");
        console.log("Bio changed:", oldProfile.bio, "->", updatedProfile.bio);
      }

      if (hasChanged(oldProfile.phone, updatedProfile.phone)) {
        changedFields.push("Phone");
        console.log(
          "Phone changed:",
          oldProfile.phone,
          "->",
          updatedProfile.phone
        );
      }

      if (hasChanged(oldProfile.location, updatedProfile.location)) {
        changedFields.push("Location");
        console.log(
          "Location changed:",
          oldProfile.location,
          "->",
          updatedProfile.location
        );
      }

      // Generic check for any other fields that might have been updated
      const fieldsToCheck = Object.keys(profileData);
      fieldsToCheck.forEach((field) => {
        if (
          ![
            "name",
            "username",
            "email",
            "profileImage",
            "bio",
            "phone",
            "location",
          ].includes(field)
        ) {
          if (hasChanged(oldProfile[field], updatedProfile[field])) {
            // Capitalize first letter for display
            const displayField = field.charAt(0).toUpperCase() + field.slice(1);
            changedFields.push(displayField);
            console.log(
              `${displayField} changed:`,
              oldProfile[field],
              "->",
              updatedProfile[field]
            );
          }
        }
      });

      console.log("Changed fields:", changedFields);

      if (changedFields.length > 0) {
        const updateEmailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; text-align: center;">Profile Updated Successfully ✅</h2>
              <p>Hi ${updatedProfile.name || "there"},</p>
              <p>Your TodoApp profile has been successfully updated!</p>
              <p><strong>Updated fields:</strong></p>
              <ul>
                ${changedFields.map((field) => `<li>${field}</li>`).join("")}
              </ul>
              <p><strong>Current profile details:</strong></p>
              <ul>
                <li><strong>Name:</strong> ${
                  updatedProfile.name || "Not provided"
                }</li>
                <li><strong>Email:</strong> ${updatedProfile.email}</li>
                <li><strong>Username:</strong> ${
                  updatedProfile.username || "Not provided"
                }</li>
                ${
                  updatedProfile.bio
                    ? `<li><strong>Bio:</strong> ${updatedProfile.bio}</li>`
                    : ""
                }
                ${
                  updatedProfile.phone
                    ? `<li><strong>Phone:</strong> ${updatedProfile.phone}</li>`
                    : ""
                }
                ${
                  updatedProfile.location
                    ? `<li><strong>Location:</strong> ${updatedProfile.location}</li>`
                    : ""
                }
              </ul>
              <p>If you didn't make these changes, please contact our support team immediately.</p>
              <p>Best regards,<br>The TodoApp Team</p>
            </div>
          `;

        const message = `Your profile has been updated successfully. Changed fields: ${changedFields.join(
          ", "
        )}`;

        // Send complete notification (Socket.IO + Push + Email)
        try {
          const notificationResult = await sendCompleteNotification(
            updatedProfile.uid,
            {
              message,
              type: "profile_updated",
              todoId: null, // Explicitly set for profile notifications
              pushPayload: {
                title: "Profile Updated ✅",
                body: message,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                data: {
                  type: "profile_updated",
                  changedFields: changedFields,
                },
              },
            },
            {
              email: updatedProfile.email,
              subject: "TodoApp - Profile Updated Successfully",
              htmlContent: updateEmailContent,
            }
          );
          console.log(
            "Profile update notification sent, result:",
            notificationResult
          );
        } catch (notificationError) {
          console.error(
            "Profile update notification error:",
            notificationError
          );
        }
      } else {
        console.log("No fields were actually changed - skipping notifications");
      }
    } else {
      console.log("Skipping update notifications - missing uid or email");
      console.log("uid:", updatedProfile.uid, "email:", updatedProfile.email);
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// Additional helper function to get profile by multiple identifiers
exports.getProfileByAnyId = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Flexible search for profile with ID:", id);

    // Try multiple search strategies
    let profile = null;

    // 1. Search by uid
    profile = await userProfile.findOne({ uid: id });
    if (profile) {
      console.log("Found profile by uid");
      return res.json(profile);
    }

    // 2. Search by email if it looks like an email
    if (id.includes("@")) {
      profile = await userProfile.findOne({ email: id });
      if (profile) {
        console.log("Found profile by email");
        return res.json(profile);
      }
    }

    // 3. Search by MongoDB _id
    try {
      profile = await userProfile.findById(id);
      if (profile) {
        console.log("Found profile by _id");
        return res.json(profile);
      }
    } catch (err) {
      console.log("Invalid _id format for MongoDB");
    }

    // 4. Search by username
    profile = await userProfile.findOne({ username: id });
    if (profile) {
      console.log("Found profile by username");
      return res.json(profile);
    }

    // If nothing found
    return res.status(404).json({
      error: "Profile not found",
      searchedId: id,
      message: "No profile found with any matching identifier",
    });
  } catch (error) {
    console.error("Error in flexible profile search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// New function to send custom notifications with all types
exports.sendCustomNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject,
      message,
      type = "info",
      sendEmail = true,
      sendPush = true,
      sendSocket = true,
    } = req.body;

    console.log("Sending custom notification for user:", id);
    console.log("Notification options:", {
      subject,
      message,
      type,
      sendEmail,
      sendPush,
      sendSocket,
    });

    if (!subject || !message) {
      return res.status(400).json({
        error: "Subject and message are required",
      });
    }

    // Find user profile
    let profile = await userProfile.findOne({ uid: id });
    if (!profile) {
      profile = await userProfile.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    console.log("Found profile for custom notification:", profile.uid);

    const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; text-align: center;">${subject}</h2>
                <p>Hi ${profile.name || "there"},</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    ${message}
                </div>
                <p>Best regards,<br>The TodoApp Team</p>
            </div>
        `;

    // Prepare notification data
    const notificationData = {
      message,
      type,
      todoId: null, // Explicitly set for custom notifications
      pushPayload: sendPush
        ? {
            title: subject,
            body: message,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: { type },
          }
        : null,
    };
    const emailData =
      sendEmail && profile.email
        ? {
            email: profile.email,
            subject,
            htmlContent: emailContent,
          }
        : null;

    // Send complete notification or selective notifications
    if (sendSocket || sendPush || sendEmail) {
      try {
        const notificationResult = await sendCompleteNotification(
          profile.uid,
          notificationData,
          emailData
        );
        console.log("Custom notification sent, result:", notificationResult);
      } catch (notificationError) {
        console.error("Custom notification error:", notificationError);
      }
    }

    res.json({
      success: true,
      message: "Custom notification sent successfully",
      sentTo: profile.email || profile.uid,
      notificationTypes: {
        email: sendEmail && !!profile.email,
        push: sendPush,
        socket: sendSocket,
      },
    });
  } catch (error) {
    console.error("Error sending custom notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// New function to delete user profile with notification
exports.deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Find profile first
    let profile = await userProfile.findOne({ uid: id });
    if (!profile) {
      profile = await userProfile.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        searchedId: id,
        message: "No profile found with the provided identifier",
      });
    }

    // Store profile data for notifications before deletion
    const profileData = {
      name: profile.name,
      email: profile.email,
      uid: profile.uid,
    };

    // Delete the profile
    await userProfile.findByIdAndDelete(profile._id);

    // Send deletion confirmation notification
    if (profileData.email) {
      const deletionEmailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Profile Deleted Successfully 🗑️</h2>
                    <p>Hi ${profileData.name || "there"},</p>
                    <p>Your TodoApp profile has been successfully deleted from our system.</p>
                    <p>We're sorry to see you go! If you change your mind, you can always create a new profile.</p>
                    <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                    <p>Best regards,<br>The TodoApp Team</p>
                </div>
            `;

      const message = `Your TodoApp profile has been deleted successfully.`;

      // Send notification (only email since profile is deleted)
      try {
        const emailResult = await sendEmailNotification(
          profileData.email,
          "TodoApp - Profile Deleted Successfully",
          deletionEmailContent
        );
        console.log("Deletion email sent, result:", emailResult);
      } catch (emailError) {
        console.error("Deletion email error:", emailError);
      }

      // Clean up related data
      try {
        await Notification.deleteMany({ user: profileData.uid });
        await PushSubscription.deleteMany({ user: profileData.uid });
        console.log(
          "Cleaned up related notifications and push subscriptions for:",
          profileData.uid
        );
      } catch (cleanupError) {
        console.error("Error cleaning up related data:", cleanupError);
      }
    }

    res.json({
      success: true,
      message: "Profile deleted successfully",
      deletedProfile: {
        name: profileData.name,
        email: profileData.email,
        uid: profileData.uid,
      },
    });
  } catch (error) {
    console.error("Error deleting user profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// New function to get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    // Find profile to get uid
    let profile = await userProfile.findOne({ uid: id });
    if (!profile) {
      profile = await userProfile.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    // Build query
    const query = { user: profile.uid };
    if (unreadOnly === "true") {
      query.read = false;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    // Get total count
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: profile.uid,
      read: false,
    });

    res.json({
      notifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// New function to mark notifications as read
exports.markNotificationsAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { notificationIds } = req.body; // Array of notification IDs, or empty for all

    // Find profile to get uid
    let profile = await userProfile.findOne({ uid: id });
    if (!profile) {
      profile = await userProfile.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    let updateQuery = { user: profile.uid, read: false };

    // If specific notification IDs provided, only update those
    if (notificationIds && notificationIds.length > 0) {
      updateQuery._id = { $in: notificationIds };
    }

    const result = await Notification.updateMany(updateQuery, {
      read: true,
      readAt: new Date(),
    });

    res.json({
      success: true,
      message: "Notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Debug function to test notifications
exports.testNotifications = async (req, res) => {
  try {
    const { id } = req.params;

    // Find profile
    let profile = await userProfile.findOne({ uid: id });
    if (!profile) {
      profile = await userProfile.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    console.log("Testing notifications for profile:", profile.uid);

    const testMessage = "This is a test notification to debug the system.";
    const testEmailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; text-align: center;">Test Notification 🧪</h2>
                <p>Hi ${profile.name || "there"},</p>
                <p>${testMessage}</p>
                <p>If you received this, the notification system is working correctly!</p>
                <p>Best regards,<br>The TodoApp Team</p>
            </div>
        `;

    // Send complete notification
    const notificationResult = await sendCompleteNotification(
      profile.uid,
      {
        message: testMessage,
        type: "test",
        todoId: null, // Explicitly set for test notifications
        pushPayload: {
          title: "Test Notification 🧪",
          body: testMessage,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: { type: "test" },
        },
      },
      {
        email: profile.email,
        subject: "TodoApp - Test Notification",
        htmlContent: testEmailContent,
      }
    );
    res.json({
      success: true,
      message: "Test notification sent",
      notificationResult,
      profileData: {
        uid: profile.uid,
        email: profile.email,
        name: profile.name,
      },
    });
  } catch (error) {
    console.error("Error testing notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
