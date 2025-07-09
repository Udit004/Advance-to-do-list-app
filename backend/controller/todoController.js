const Todo = require('../models/todo');
const Notification = require('../models/notificationModel');
const PushSubscription = require('../models/pushSubscriptionModel');
const { getIo } = require('../socket');
const io = getIo();
const transporter = require('../config/email');
const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, EMAIL_USER } = process.env;

// Set web-push credentials
webpush.setVapidDetails(`mailto:${EMAIL_USER}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Utility function: Send push notification
const sendPushNotifications = async (userId, payload) => {
  const subscriptions = await PushSubscription.find({ user: userId });
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (error) {
      console.error('Push Notification Error:', error.message);
    }
  }
};

// POST - Create Todo
const createTodo = async (req, res) => {
  try {
    const { task, isCompleted, description, dueDate, priority, user, list, project } = req.body;

    if (!task) return res.status(400).json({ message: "Task is required" });

    const newTodo = new Todo({ 
      task, 
      isCompleted: isCompleted || false, 
      description, 
      dueDate, 
      priority, 
      user, 
      list: list || "general", 
      project: project || null
    });
    const savedTodo = await newTodo.save();

    const message = `New todo created: "${savedTodo.task}"`;

    await Notification.create({ user, todoId: savedTodo._id, message, type: 'new_todo', read: false });
    io.emit('newNotification', { userId: user, message });
    await sendPushNotifications(user, { title: "New Todo", body: message });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: req.user.email,
      subject: 'New Todo Created',
      html: `<p>Your new task: <strong>${savedTodo.task}</strong> has been created.</p>`
    });

    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating todo", error: error.message });
  }
};

// PATCH - Toggle Todo Status
const toggleTodoStatus = async (req, res) => {
  try {
    const todoId = req.params.id;
    if (!todoId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid ID" });

    const todo = await Todo.findById(todoId);
    if (!todo) return res.status(404).json({ message: "Todo not found" });

    todo.isCompleted = !todo.isCompleted;
    todo.completeDate = todo.isCompleted ? new Date() : null;
    const updatedTodo = await todo.save();

    if (updatedTodo.isCompleted) {
      const message = `Todo completed: "${updatedTodo.task}"`;

      await Notification.findOneAndUpdate(
        { user: updatedTodo.user, todoId: updatedTodo._id, type: 'todo_completed' },
        { $set: { message, read: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      io.emit('newNotification', { userId: updatedTodo.user, message });
      await sendPushNotifications(updatedTodo.user, { title: "Task Completed", body: message });

      await transporter.sendMail({
        from: EMAIL_USER,
        to: req.user.email,
        subject: 'Todo Completed',
        html: `<p>Your task <strong>${updatedTodo.task}</strong> has been completed.</p>`
      });
    }

    res.status(200).json({ success: true, message: "Todo status updated", data: updatedTodo });
  } catch (error) {
    res.status(500).json({ message: "Error toggling status", error: error.message });
  }
};

// PUT - Update Todo
const updateTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const updates = req.body;

    const updatedTodo = await Todo.findByIdAndUpdate(todoId, updates, { new: true });
    if (!updatedTodo) return res.status(404).json({ error: "Todo not found" });

    const message = `Todo updated: "${updatedTodo.task}"`;

    await Notification.create({ user: updatedTodo.user, todoId: updatedTodo._id, message, type: 'todo_updated', read: false });
    io.emit('newNotification', { userId: updatedTodo.user, message });
    await sendPushNotifications(updatedTodo.user, { title: "Todo Updated", body: message });

    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE - Delete Todo
const deleteTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const deletedTodo = await Todo.findByIdAndDelete(todoId);
    if (!deletedTodo) return res.status(404).json({ error: "Todo not found" });

    const message = `Todo deleted: "${deletedTodo.task}"`;

    await Notification.create({ user: deletedTodo.user, todoId: deletedTodo._id, message, type: 'todo_deleted', read: false });
    io.emit('newNotification', { userId: deletedTodo.user, message });
    await sendPushNotifications(deletedTodo.user, { title: "Todo Deleted", body: message });

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting todo" });
  }
};

// PATCH - Update Priority
const updateTodoPriority = async (req, res) => {
  try {
    const todoId = req.params.id;
    const { priority } = req.body;

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }

    const todo = await Todo.findById(todoId);
    if (!todo) return res.status(404).json({ message: "Todo not found" });

    todo.priority = priority;
    const updatedTodo = await todo.save();

    res.status(200).json({ success: true, message: "Priority updated", data: updatedTodo });
  } catch (error) {
    res.status(500).json({ error: "Error updating priority" });
  }
};

// GET - All Todos by User
const getTodosByUser = async (req, res) => {
  try {
    const userId = req.params.uid;
    const projectId = req.query.project;
    const excludeProjectTodos = req.query.excludeProjectTodos === 'true';

    if (!userId) return res.status(400).json({ message: "User ID required" });

    const query = { user: userId };

    if (projectId) {
      query.project = projectId;
    } else if (excludeProjectTodos) {
      query.project = { $eq: null }; // ✅ Properly exclude project-based todos
    }

    const todos = await Todo.find(query);
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ error: "Error fetching todos" });
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
