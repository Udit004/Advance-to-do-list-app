// components/NotificationBell.jsx
import API from "../api/config";
import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await API.get(`/notifications/${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Handle new notification
  const handleNewNotification = useCallback(
    (notification) => {
      console.log("🔔 New notification received:", notification);

      // Check if notification is for current user
      if (notification.user === userId || notification.userId === userId) {
        setNotifications((prevNotifications) => {
          // Check if notification already exists to avoid duplicates
          const existingNotification = prevNotifications.find(
            (n) => n._id === notification._id
          );

          if (!existingNotification) {
            return [notification, ...prevNotifications];
          }

          return prevNotifications;
        });
      }
    },
    [userId]
  );

  // Initialize socket connection
  useEffect(() => {
    if (!userId || isConnectingRef.current) {
      return;
    }

    console.log('🔧 Initializing socket for user:', userId);
    
    // Fetch initial notifications
    fetchNotifications();

    // Prevent multiple connections
    isConnectingRef.current = true;

    // Clean up any existing socket connection
    if (socketRef.current) {
      console.log('🧹 Cleaning up existing socket connection');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Fix: Get the base URL without /api
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    // Remove /api from the end if it exists
    const socketUrl = baseUrl.replace(/\/api$/, '');
    console.log('🔧 Connecting to socket URL:', socketUrl);

    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      // Remove forceNew to prevent issues
      upgrade: true,
    });

    const socket = socketRef.current;

    // Enhanced connection logging
    socket.on("connect", () => {
      console.log("✅ Socket connected successfully");
      console.log("   - Socket ID:", socket.id);
      console.log("   - Transport:", socket.io.engine.transport.name);
      console.log("   - User ID:", userId);
      
      setIsConnected(true);
      setError(null);
      isConnectingRef.current = false;

      // Join user's room for targeted notifications
      socket.emit("join", userId);
      console.log("📡 Emitted join event for user:", userId);
    });

    socket.on("joined", (data) => {
      console.log("✅ Successfully joined room:", data);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
      isConnectingRef.current = false;

      // Only emit leave if socket is still connected
      if (socket.connected) {
        socket.emit("leave", userId);
        console.log("📡 Emitted leave event for user:", userId);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      console.error("   - Error type:", error.type);
      console.error("   - Error description:", error.description);
      
      setIsConnected(false);
      isConnectingRef.current = false;
      
      // Handle specific error types
      if (error.message.includes("Invalid namespace")) {
        setError("Configuration error. Please contact support.");
      } else if (error.message.includes("timeout")) {
        setError("Connection timeout. Retrying...");
      } else {
        setError("Connection error. Retrying...");
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setError(null);
      isConnectingRef.current = false;

      // Rejoin user's room
      socket.emit("join", userId);
      console.log("📡 Re-emitted join event for user:", userId);

      // Refresh notifications after reconnection
      fetchNotifications();
    });

    socket.on("reconnect_error", (error) => {
      console.error("❌ Socket reconnection error:", error);
      setError("Reconnection failed. Retrying...");
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed completely");
      setError("Connection failed. Please refresh the page.");
      isConnectingRef.current = false;
    });

    // Listen for new notifications with enhanced logging
    socket.on("newNotification", (notification) => {
      console.log("🔔 New notification received:", notification);
      handleNewNotification(notification);
    });

    // Transport change logging
    socket.io.on("upgrade", () => {
      console.log("🔄 Transport upgraded to:", socket.io.engine.transport.name);
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        const currentSocket = socketRef.current;
        console.log('🧹 Cleaning up socket connection');

        // Remove event listeners first
        currentSocket.off("connect");
        currentSocket.off("joined");
        currentSocket.off("disconnect");
        currentSocket.off("connect_error");
        currentSocket.off("reconnect");
        currentSocket.off("reconnect_error");
        currentSocket.off("reconnect_failed");
        currentSocket.off("newNotification");

        // Emit leave if still connected
        if (currentSocket.connected) {
          currentSocket.emit("leave", userId);
          console.log("📡 Emitted leave event during cleanup for user:", userId);
        }

        // Disconnect and clean up
        currentSocket.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      isConnectingRef.current = false;
    };
  }, [userId, fetchNotifications, handleNewNotification]);

  // Mark notification as read
  const handleRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);

      if (unreadNotifications.length === 0) return;

      // Update all unread notifications
      await Promise.all(
        unreadNotifications.map((notification) =>
          API.put(`/notifications/read/${notification._id}`)
        )
      );

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && !event.target.closest(".notification-panel")) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5-5v5zM4 4h11v5H4V4zm0 7h11v9H4v-9z"
          />
        </svg>

        {/* Connection status indicator */}
        <div
          className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 border border-white/10 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-white text-lg">
                Notifications
              </h4>
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
                title={isConnected ? "Connected" : "Disconnected"}
              ></div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                <p className="text-white/60">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-5-5v5zM4 4h11v5H4V4zm0 7h11v9H4v-9z"
                    />
                  </svg>
                </div>
                <p className="text-white/60">No notifications yet</p>
                <p className="text-white/40 text-sm mt-1">
                  You'll see your updates here
                </p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors duration-200 ${
                      !notification.read ? "bg-cyan-500/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            !notification.read
                              ? "text-white font-medium"
                              : "text-white/80"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {!notification.read && (
                        <div className="flex items-center space-x-2 ml-3">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                          <button
                            onClick={() => handleRead(notification._id)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-200 whitespace-nowrap"
                          >
                            Mark as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10">
              <button
                onClick={() => setOpen(false)}
                className="w-full text-center text-sm text-white/60 hover:text-white/80 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;