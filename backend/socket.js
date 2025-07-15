const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://advance-to-do-list-app.vercel.app",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    connectTimeout: 60000,
    serveClient: false,
    // Fix: Ensure proper namespace
    path: "/socket.io/",
  });

  // Handle connection - ADD ERROR HANDLING
  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);
    console.log("   - Transport:", socket.conn.transport.name);
    console.log("   - Headers:", socket.request.headers);

    // Handle user joining their room - ADD VALIDATION
    socket.on("join", (userId) => {
      console.log("📡 Join event received for userId:", userId);

      if (!userId || typeof userId !== "string") {
        console.warn("❌ Invalid userId provided for join:", userId);
        socket.emit("error", { message: "Invalid userId" });
        return;
      }

      try {
        socket.join(userId);
        console.log(`✅ User ${userId} joined room: ${userId}`);

        // Confirm the join with room info
        const room = io.sockets.adapter.rooms.get(userId);
        socket.emit("joined", {
          userId,
          room: userId,
          clientsInRoom: room ? room.size : 0,
        });

        console.log(
          `📊 Room ${userId} now has ${room ? room.size : 0} clients`
        );
      } catch (error) {
        console.error("❌ Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Handle user leaving their room
    socket.on("leave", (userId) => {
      if (userId && typeof userId === "string") {
        socket.leave(userId);
        console.log(`✅ User ${userId} left room: ${userId}`);
      } else {
        console.warn("❌ Invalid userId provided for leave:", userId);
      }
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log("❌ User disconnected:", socket.id, "Reason:", reason);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    // Add ping/pong for connection health
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  // Handle server errors
  io.engine.on("connection_error", (err) => {
    console.error("❌ Socket.IO engine connection error:", err);
  });

  return io;
};
const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Send notification to specific user
const sendNotificationToUser = (userId, notificationData) => {
  if (!io) {
    console.error("❌ Socket.io not initialized");
    return false;
  }

  if (!userId || typeof userId !== "string") {
    console.error("❌ Invalid userId provided:", userId);
    return false;
  }

  if (!notificationData) {
    console.error("❌ No notification data provided");
    return false;
  }

  try {
    console.log(`📡 Attempting to send notification to user ${userId}`);
    console.log("📄 Notification data:", notificationData);

    // Check if room exists and has clients
    const room = io.sockets.adapter.rooms.get(userId);
    if (!room || room.size === 0) {
      console.log(
        `⚠️ No clients in room ${userId} - notification queued but not delivered`
      );
      return false;
    }

    console.log(`📊 Room ${userId} has ${room.size} connected clients`);

    // Send to specific user room
    io.to(userId).emit("newNotification", notificationData);
    console.log(
      `✅ Notification sent to user ${userId}:`,
      notificationData.message
    );

    return true;
  } catch (error) {
    console.error("❌ Error sending notification to user:", error);
    return false;
  }
};

// Send notification to all connected users (optional utility function)
const sendNotificationToAll = (notificationData) => {
  if (!io) {
    console.error("❌ Socket.io not initialized");
    return;
  }

  try {
    io.emit("newNotification", notificationData);
    console.log("✅ Notification sent to all users:", notificationData.message);
  } catch (error) {
    console.error("❌ Error sending notification to all users:", error);
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
  getUsersInRoom,
};
