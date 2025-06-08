const cron = require('node-cron');
const Todo = require('../models/todo');
const Notification = require('../models/notificationModel');
const { io } = require('../index');

cron.schedule('*/1 * * * *', async () => {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueSoonTodos = await Todo.find({
    isCompleted: false,
    dueDate: {
      $gte: today,
      $lt: tomorrow
    }
  });

  console.log(`📌 Found ${dueSoonTodos.length} due soon todos`);

  for (let todo of dueSoonTodos) {
    const exists = await Notification.findOne({
      user: todo.user,
      todoId: todo._id,
      type: 'due_soon'
    });

    if (!exists) {
      console.log(`📤 Creating new notification for: ${todo.task}`);
      await Notification.create({
        user: todo.user,
        todoId: todo._id,
        message: `Your todo "${todo.task}" is due soon`,
        type: 'due_soon',
        read: false
      });
      io.emit('newNotification', { userId: todo.user, message: `Your todo "${todo.task}" is due soon` });
    } else {
      console.log(`🔁 Notification already exists for: ${todo.task}`);
    }
  }

  const overdueTodos = await Todo.find({
    isCompleted: false,
    dueDate: {
      $lt: today
    }
  });

  console.log(`⚠️ Found ${overdueTodos.length} overdue todos`);

  for (let todo of overdueTodos) {
    const exists = await Notification.findOne({
      user: todo.user,
      todoId: todo._id,
      type: 'overdue'
    });

    if (!exists) {
      console.log(`📤 Creating new overdue notification for: ${todo.task}`);
      await Notification.create({
        user: todo.user,
        todoId: todo._id,
        message: `Your todo "${todo.task}" is overdue`,
        type: 'overdue',
        read: false
      });
      io.emit('newNotification', { userId: todo.user, message: `Your todo "${todo.task}" is overdue` });
    } else {
      console.log(`🔁 Overdue notification already exists for: ${todo.task}`);
    }
  }

  console.log('✅ Notification job executed successfully');
});


const startNotificationClearnup = () =>{
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Starting notification cleanup');
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    try {
      const result = await Notification.deleteMany({
        read: true,
        createdAt: {
          $lt: twoDaysAgo
        }
      });

      console.log(`🗑️ Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('Error during notification cleanup:', error);
    }
  });
};

module.exports =  startNotificationClearnup;