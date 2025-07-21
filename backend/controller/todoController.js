const Todo = require("../models/todo");
const Notification = require("../models/notificationModel");
const PushSubscription = require("../models/pushSubscriptionModel");
const { sendNotificationToUser } = require("../socket");
const webpush = require("web-push");
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, EMAIL_USER } = process.env;

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

// Utility function: Send notification (Socket.IO + Push only)
const sendNotification = async (userId, notificationData) => {
  try {
    // Check if notification already exists to prevent duplicates
    const existingNotification = await Notification.findOne({
      user: userId,
      todoId: notificationData.todoId,
      type: notificationData.type,
    });

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
    } else {
      // Create new notification
      notification = await Notification.create({
        user: userId,
        todoId: notificationData.todoId,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
      });
    }

    // Send real-time notification via Socket.IO
    sendNotificationToUser(userId, {
      _id: notification._id,
      user: userId,
      todoId: notificationData.todoId,
      message: notificationData.message,
      type: notificationData.type,
      read: false,
      createdAt: notification.createdAt,
    });

    // Send push notification
    if (notificationData.pushPayload) {
      await sendPushNotifications(userId, notificationData.pushPayload);
    }

    return notification;
  } catch (error) {
    console.error("Error in sendNotification:", error);
    // Don't throw error for notification failures - continue with main operation
    return null;
  }
};

// POST - Create Todo
const createTodo = async (req, res) => {
  try {
    const {
      task,
      isCompleted,
      description,
      dueDate,
      priority,
      user,
      list,
      project,
    } = req.body;

    if (!task) {
      return res.status(400).json({ message: "Task is required" });
    }

    if (!user) {
      return res.status(400).json({ message: "User is required" });
    }

    const newTodo = new Todo({
      task,
      isCompleted: isCompleted || false,
      description,
      dueDate,
      priority,
      user,
      list: list || "general",
      project: project || null, // Explicitly set to null for standalone todos
    });

    const savedTodo = await newTodo.save();

    // Send notification in background (Socket.IO + Push only)
    const message = `New todo created: "${savedTodo.task}"`;
    sendNotification(user, {
      todoId: savedTodo._id,
      message,
      type: "new_todo",
      pushPayload: {
        title: "New Todo Created",
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: { todoId: savedTodo._id, type: "new_todo" },
      },
    }).catch((err) => {
      console.error("Background notification error:", err);
    });

    res.status(201).json(savedTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({
      success: false,
      message: "Error creating todo",
      error: error.message,
    });
  }
};

// PATCH - Toggle Todo Status
const toggleTodoStatus = async (req, res) => {
  try {
    const todoId = req.params.id;
    const { isCompleted } = req.body;

    if (!todoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const wasCompleted = todo.isCompleted;
    todo.isCompleted =
      isCompleted !== undefined ? isCompleted : !todo.isCompleted;
    todo.completeDate = todo.isCompleted ? new Date() : null;

    const updatedTodo = await todo.save();

    // Send notification in background - only for task completion
    if (updatedTodo.isCompleted && !wasCompleted) {
      const message = `Todo completed: "${updatedTodo.task}"`;

      // Send notification (Socket.IO + Push only)
      sendNotification(updatedTodo.user, {
        todoId: updatedTodo._id,
        message,
        type: "todo_completed",
        pushPayload: {
          title: "Task Completed! 🎉",
          body: message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: { todoId: updatedTodo._id, type: "todo_completed" },
        },
      }).catch((err) => {
        console.error("Background notification error:", err);
      });
    }

    res.status(200).json({
      success: true,
      message: "Todo status updated successfully",
      data: updatedTodo,
    });
  } catch (error) {
    console.error("Error toggling todo status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling status",
      error: error.message,
    });
  }
};

// PUT - Update Todo
const updateTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const updates = req.body;

    if (!todoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Remove fields that shouldn't be updated or are handled separately
    const allowedUpdates = [
      "task",
      "description",
      "dueDate",
      "priority",
      "list",
    ];
    const filteredUpdates = {};

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // IMPORTANT: Don't allow updating the project field here to prevent standalone todos from being assigned to projects accidentally
    // The project field should only be updated through the project management endpoints

    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      { ...filteredUpdates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    // Send notification in background (Socket.IO + Push only)
    const message = `Todo updated: "${updatedTodo.task}"`;
    sendNotification(updatedTodo.user, {
      todoId: updatedTodo._id,
      message,
      type: "todo_updated",
      pushPayload: {
        title: "Todo Updated",
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: { todoId: updatedTodo._id, type: "todo_updated" },
      },
    }).catch((err) => {
      console.error("Background notification error:", err);
    });

    res.status(200).json(updatedTodo);
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({
      success: false,
      error: "Error updating todo",
      message: error.message,
    });
  }
};

// DELETE - Delete Todo
const deleteTodo = async (req, res) => {
  try {
    const todoId = req.params.id;

    if (!todoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const deletedTodo = await Todo.findByIdAndDelete(todoId);
    if (!deletedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    // Send notification in background (Socket.IO + Push only)
    const message = `Todo deleted: "${deletedTodo.task}"`;
    sendNotification(deletedTodo.user, {
      todoId: deletedTodo._id,
      message,
      type: "todo_deleted",
      pushPayload: {
        title: "Todo Deleted",
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: { todoId: deletedTodo._id, type: "todo_deleted" },
      },
    }).catch((err) => {
      console.error("Background notification error:", err);
    });

    res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting todo",
      message: error.message,
    });
  }
};

// PATCH - Update Priority
const updateTodoPriority = async (req, res) => {
  try {
    const todoId = req.params.id;
    const { priority } = req.body;

    if (!["low", "medium", "high"].includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }

    if (!todoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    todo.priority = priority;
    todo.updatedAt = new Date();
    const updatedTodo = await todo.save();

    res.status(200).json({
      success: true,
      message: "Priority updated successfully",
      data: updatedTodo,
    });
  } catch (error) {
    console.error("Error updating priority:", error);
    res.status(500).json({
      success: false,
      error: "Error updating priority",
      message: error.message,
    });
  }
};

// GET - All Todos by User - FIXED FILTERING
const getTodosByUser = async (req, res) => {
  try {
    const userId = req.params.uid;
    const projectId = req.query.project;
    const excludeProjectTodos = req.query.excludeProjectTodos === "true";

    console.log("getTodosByUser - Query params:", {
      userId,
      projectId,
      excludeProjectTodos,
    });

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const query = { user: userId };

    // ✅ FINAL CORRECT FILTER LOGIC
    if (projectId) {
      query.project = projectId;
    } else if (excludeProjectTodos) {
      query.project = null; // Only standalone todos
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    const todos = await Todo.find(query).sort({ createdAt: -1 });

    console.log(`Found ${todos.length} todos for user ${userId}`);
    if (todos.length > 0) {
      console.log(
        "Sample todos project fields:",
        todos.slice(0, 3).map((t) => ({
          id: t._id,
          task: t.task,
          project: t.project,
        }))
      );
    }

    res.status(200).json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching todos",
      message: error.message,
    });
  }
};

module.exports = {
  createTodo,
  toggleTodoStatus,
  updateTodo,
  deleteTodo,
  updateTodoPriority,
  getTodosByUser,
};
