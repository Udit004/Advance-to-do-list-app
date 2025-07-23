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
    path: "/socket.io/",
  });

  // Store user sessions for project tracking
  const userSessions = new Map(); // socketId -> { userId, projectId, userInfo }
  const projectUsers = new Map(); // projectId -> Set of user objects

  // Handle connection
  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);
    console.log("   - Transport:", socket.conn.transport.name);

    // Handle user joining their personal room (for notifications)
    socket.on("join", (userId) => {
      console.log("📡 Join event received for userId:", userId);

      if (!userId || typeof userId !== "string") {
        console.warn("❌ Invalid userId provided for join:", userId);
        socket.emit("error", { message: "Invalid userId" });
        return;
      }

      try {
        socket.join(userId);
        console.log(`✅ User ${userId} joined personal room: ${userId}`);

        const room = io.sockets.adapter.rooms.get(userId);
        socket.emit("joined", {
          userId,
          room: userId,
          clientsInRoom: room ? room.size : 0,
        });

        console.log(
          `📊 Personal room ${userId} now has ${room ? room.size : 0} clients`
        );
      } catch (error) {
        console.error("❌ Error joining personal room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // NEW: Handle joining project room for collaboration
    socket.on("joinProject", async (data) => {
      const { projectId, userId, userInfo } = data;

      console.log("🏢 Project join request:", { projectId, userId, userInfo });

      if (!projectId || !userId) {
        socket.emit("projectError", {
          message: "ProjectId and userId are required",
        });
        return;
      }

      try {
        // Leave any previous project room
        const previousSession = userSessions.get(socket.id);
        if (previousSession && previousSession.projectId) {
          await handleLeaveProject(socket, previousSession);
        }

        // Join new project room
        socket.join(`project:${projectId}`);

        // Store user session
        const sessionData = {
          userId,
          projectId,
          userInfo: userInfo || { username: "Anonymous User", role: "viewer" },
        };
        userSessions.set(socket.id, sessionData);

        // Update project users tracking
        if (!projectUsers.has(projectId)) {
          projectUsers.set(projectId, new Set());
        }

        const projectUserSet = projectUsers.get(projectId);
        // Remove any existing entry for this user (prevent duplicates)
        projectUserSet.forEach((user) => {
          if (user.userId === userId) {
            projectUserSet.delete(user);
          }
        });
        // Add current user
        projectUserSet.add({
          userId,
          socketId: socket.id,
          ...sessionData.userInfo,
          joinedAt: new Date(),
        });

        console.log(
          `✅ User ${userId} joined project room: project:${projectId}`
        );

        // Confirm join to the user
        socket.emit("projectJoined", {
          projectId,
          userId,
          activeUsers: Array.from(projectUserSet),
        });

        // Broadcast to other users in the project
        socket.to(`project:${projectId}`).emit("userJoinedProject", {
          projectId,
          user: {
            userId,
            socketId: socket.id,
            ...sessionData.userInfo,
            joinedAt: new Date(),
          },
          activeUsers: Array.from(projectUserSet),
        });

        const room = io.sockets.adapter.rooms.get(`project:${projectId}`);
        console.log(
          `📊 Project room ${projectId} now has ${room ? room.size : 0} clients`
        );
      } catch (error) {
        console.error("❌ Error joining project room:", error);
        socket.emit("projectError", { message: "Failed to join project room" });
      }
    });

    // NEW: Handle leaving project room
    socket.on("leaveProject", async (data) => {
      const { projectId, userId } = data;
      const session = userSessions.get(socket.id);

      if (session) {
        await handleLeaveProject(socket, session);
      }
    });

    // Helper function to handle leaving project
    async function handleLeaveProject(socket, session) {
      const { projectId, userId } = session;

      try {
        socket.leave(`project:${projectId}`);

        // Remove from project users tracking
        const projectUserSet = projectUsers.get(projectId);
        if (projectUserSet) {
          projectUserSet.forEach((user) => {
            if (user.socketId === socket.id) {
              projectUserSet.delete(user);
            }
          });

          // Clean up empty project rooms
          if (projectUserSet.size === 0) {
            projectUsers.delete(projectId);
          }
        }

        // Remove user session
        userSessions.delete(socket.id);

        console.log(
          `✅ User ${userId} left project room: project:${projectId}`
        );

        // Broadcast to remaining users
        socket.to(`project:${projectId}`).emit("userLeftProject", {
          projectId,
          userId,
          socketId: socket.id,
          activeUsers: projectUserSet ? Array.from(projectUserSet) : [],
        });
      } catch (error) {
        console.error("❌ Error leaving project room:", error);
      }
    }

    // Handle user leaving their personal room
    socket.on("leave", (userId) => {
      if (userId && typeof userId === "string") {
        socket.leave(userId);
        console.log(`✅ User ${userId} left personal room: ${userId}`);
      } else {
        console.warn("❌ Invalid userId provided for leave:", userId);
      }
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log("❌ User disconnected:", socket.id, "Reason:", reason);

      // Handle project room cleanup on disconnect
      const session = userSessions.get(socket.id);
      if (session) {
        handleLeaveProject(socket, session);
      }
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

// Existing notification functions (keep as is)
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

    const room = io.sockets.adapter.rooms.get(userId);
    if (!room || room.size === 0) {
      console.log(
        `⚠️ No clients in room ${userId} - notification queued but not delivered`
      );
      return false;
    }

    console.log(`📊 Room ${userId} has ${room.size} connected clients`);

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

// NEW: Project collaboration event emitters
const emitToProject = (projectId, eventName, data) => {
  if (!io) {
    console.error("❌ Socket.io not initialized");
    return false;
  }

  if (!projectId) {
    console.error("❌ No projectId provided");
    return false;
  }

  try {
    const room = io.sockets.adapter.rooms.get(`project:${projectId}`);
    if (!room || room.size === 0) {
      console.log(`⚠️ No clients in project room ${projectId}`);
      return false;
    }

    console.log(
      `📡 Emitting ${eventName} to project ${projectId} (${room.size} clients)`
    );
    io.to(`project:${projectId}`).emit(eventName, data);
    return true;
  } catch (error) {
    console.error(`❌ Error emitting ${eventName} to project:`, error);
    return false;
  }
};

// NEW: Specific project event functions
const emitTodoCreated = (projectId, todoData) => {
  try {
    console.log("📡 Emitting todoCreated to project:", projectId);

    return emitToProject(projectId, "todoCreated", {
      projectId,
      todo: {
        ...todoData,
        project: projectId, // Ensure project is included
      },
      createdBy: todoData.createdBy || "Anonymous",
      timestamp: new Date(),
    });
  } catch (socketError) {
    console.error("❌ Failed to emit todoCreated:", socketError);
    // Don't throw - socket errors shouldn't fail the API request
  }
};

// ✅ ALSO ADD: Retry mechanism for critical operations
const createTodoWithRetry = async (todoData, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await new Todo(todoData).save();
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError;
};

const emitTodoUpdated = (projectId, todoData) => {
  return emitToProject(projectId, "todoUpdated", {
    projectId,
    todo: todoData,
    timestamp: new Date(),
  });
};

// ✅ OPTIMIZED: More efficient socket emission functions

const emitTodoDeleted = (projectId, todoId) => {
  if (!io) {
    console.error("❌ Socket.io not initialized");
    return false;
  }

  if (!projectId || !todoId) {
    console.error("❌ Missing projectId or todoId");
    return false;
  }

  try {
    const room = io.sockets.adapter.rooms.get(`project:${projectId}`);

    // ✅ OPTIMIZED: Quick return if no clients to notify
    if (!room || room.size === 0) {
      console.log(`⚠️ No clients in project room ${projectId} - skipping emit`);
      return false;
    }

    console.log(
      `📡 Emitting todoDeleted to project ${projectId} (${room.size} clients)`
    );

    // ✅ OPTIMIZED: Minimal data payload for faster transmission
    const payload = {
      projectId,
      todoId,
      timestamp: Date.now(), // Use timestamp instead of Date object for smaller payload
    };

    io.to(`project:${projectId}`).emit("todoDeleted", payload);
    return true;
  } catch (error) {
    console.error(`❌ Error emitting todoDeleted to project:`, error);
    return false;
  }
};

// ✅ OPTIMIZED: Batch emit function for multiple operations
const emitBatchToProject = (projectId, events) => {
  if (!io || !events || events.length === 0) return false;

  try {
    const room = io.sockets.adapter.rooms.get(`project:${projectId}`);
    if (!room || room.size === 0) {
      console.log(`⚠️ No clients in project room ${projectId}`);
      return false;
    }

    console.log(`📡 Emitting ${events.length} events to project ${projectId}`);

    // Send all events in a single batch
    io.to(`project:${projectId}`).emit("batchUpdate", {
      projectId,
      events,
      timestamp: Date.now(),
    });

    return true;
  } catch (error) {
    console.error(`❌ Error emitting batch to project:`, error);
    return false;
  }
};

// ✅ OPTIMIZED: Enhanced project room management
const cleanupProjectRoom = (projectId) => {
  try {
    const projectUserSet = projectUsers.get(projectId);
    if (projectUserSet && projectUserSet.size === 0) {
      projectUsers.delete(projectId);
      console.log(`🧹 Cleaned up empty project room: ${projectId}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning up project room ${projectId}:`, error);
  }
};

// ✅ OPTIMIZED: More efficient user session management
const handleLeaveProject = async (socket, session) => {
  const { projectId, userId } = session;

  try {
    socket.leave(`project:${projectId}`);

    // ✅ OPTIMIZED: Use Map.forEach for better performance
    const projectUserSet = projectUsers.get(projectId);
    if (projectUserSet) {
      // Find and remove user more efficiently
      for (const user of projectUserSet) {
        if (user.socketId === socket.id) {
          projectUserSet.delete(user);
          break; // Exit early once found
        }
      }

      // Clean up empty rooms
      if (projectUserSet.size === 0) {
        cleanupProjectRoom(projectId);
      }
    }

    // Remove user session
    userSessions.delete(socket.id);

    console.log(`✅ User ${userId} left project room: project:${projectId}`);

    // ✅ OPTIMIZED: Only emit if there are still users to notify
    if (projectUserSet && projectUserSet.size > 0) {
      socket.to(`project:${projectId}`).emit("userLeftProject", {
        projectId,
        userId,
        socketId: socket.id,
        activeUsers: Array.from(projectUserSet),
      });
    }
  } catch (error) {
    console.error("❌ Error leaving project room:", error);
  }
};

const emitTodoToggled = (projectId, todoId, isCompleted) => {
  return emitToProject(projectId, "todoToggled", {
    projectId,
    todoId,
    isCompleted,
    timestamp: new Date(),
  });
};

// NEW: Get active users in project
const getProjectActiveUsers = (projectId) => {
  if (!io) {
    return [];
  }

  const projectUserSet = projectUsers.get(projectId);
  return projectUserSet ? Array.from(projectUserSet) : [];
};

// Existing utility functions (keep as is)
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

const getConnectedUsersCount = () => {
  if (!io) {
    return 0;
  }
  return io.engine.clientsCount;
};

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
  // NEW exports for project collaboration
  emitToProject,
  emitTodoCreated,
  createTodoWithRetry,
  emitTodoUpdated,
  emitTodoDeleted,
  emitTodoToggled,
  getProjectActiveUsers,
};
