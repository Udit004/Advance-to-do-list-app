const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173", 
        "https://advance-to-do-list-app.vercel.app",
        "http://localhost:3000",
        "https://localhost:5173"
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    // Add these for better compatibility
    maxHttpBufferSize: 1e6,
    connectTimeout: 60000,
    // Ensure proper namespace handling
    path: '/socket.io/',
    serveClient: false
  });

  // Handle connection
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Handle user joining their room
    socket.on('join', (userId) => {
      if (userId && typeof userId === 'string') {
        socket.join(userId);
        console.log(`✅ User ${userId} joined room: ${userId}`);
        
        // Confirm the join
        socket.emit('joined', { userId, room: userId });
      } else {
        console.warn('❌ Invalid userId provided for join:', userId);
      }
    });

    // Handle user leaving their room
    socket.on('leave', (userId) => {
      if (userId && typeof userId === 'string') {
        socket.leave(userId);
        console.log(`✅ User ${userId} left room: ${userId}`);
      } else {
        console.warn('❌ Invalid userId provided for leave:', userId);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Add ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  // Handle server errors
  io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.IO engine connection error:', err);
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Send notification to specific user
const sendNotificationToUser = (userId, notificationData) => {
  if (!io) {
    console.error('❌ Socket.io not initialized');
    return;
  }

  if (!userId || typeof userId !== 'string') {
    console.error('❌ Invalid userId provided:', userId);
    return;
  }

  try {
    // Send to specific user room
    io.to(userId).emit('newNotification', notificationData);
    console.log(`✅ Notification sent to user ${userId}:`, notificationData.message);
    
    // Log room information for debugging
    const room = io.sockets.adapter.rooms.get(userId);
    if (room) {
      console.log(`✅ Room ${userId} has ${room.size} connected clients`);
    } else {
      console.log(`⚠️ No clients in room ${userId}`);
    }
  } catch (error) {
    console.error('❌ Error sending notification to user:', error);
  }
};

// Send notification to all connected users (optional utility function)
const sendNotificationToAll = (notificationData) => {
  if (!io) {
    console.error('❌ Socket.io not initialized');
    return;
  }

  try {
    io.emit('newNotification', notificationData);
    console.log('✅ Notification sent to all users:', notificationData.message);
  } catch (error) {
    console.error('❌ Error sending notification to all users:', error);
  }
};

// Get connected users count
const getConnectedUsersCount = () => {
  if (!io) {
    return 0;
  }
  return io.engine.clientsCount;
};

// Get users in a specific room
const getUsersInRoom = (roomId) => {
  if (!io) {
    return [];
  }
  
  const room = io.sockets.adapter.rooms.get(roomId);
  return room ? Array.from(room) : [];
};

module.exports = { 
  initializeSocket, 
  getIo, 
  sendNotificationToUser,
  sendNotificationToAll,
  getConnectedUsersCount,
  getUsersInRoom
};