// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const useSocket = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!userId) {
      return;
    }

    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      // Fix namespace issue
      path: "/socket.io/",
      forceNew: false,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("✅ Socket connected successfully with ID:", socket.id);
      setIsConnected(true);
      setConnectionError(null);

      // Join user's room for targeted notifications
      socket.emit("join", userId);
    });

    socket.on("joined", (data) => {
      console.log("✅ Successfully joined room:", data);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);

      // Only emit leave if socket is still connected
      if (socket.connected) {
        socket.emit("leave", userId);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setIsConnected(false);
      setConnectionError("Connection error. Retrying...");
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionError(null);

      // Rejoin user's room
      socket.emit("join", userId);
    });

    socket.on("reconnect_error", (error) => {
      console.error("❌ Socket reconnection error:", error);
      setConnectionError("Reconnection failed. Retrying...");
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed completely");
      setConnectionError("Connection failed. Please refresh the page.");
    });

    // Handle pong response
    socket.on("pong", () => {
      console.log("🏓 Received pong from server");
    });

    // Cleanup function
    return () => {
      if (socket) {
        // Remove all registered listeners
        listenersRef.current.forEach((listener, event) => {
          socket.off(event, listener);
        });
        listenersRef.current.clear();

        // Emit leave if still connected
        if (socket.connected) {
          socket.emit("leave", userId);
        }

        // Remove built-in event listeners
        socket.off("connect");
        socket.off("joined");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("reconnect");
        socket.off("reconnect_error");
        socket.off("reconnect_failed");
        socket.off("pong");

        socket.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId]);

  // Function to add event listeners
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      // Remove existing listener if any
      if (listenersRef.current.has(event)) {
        socketRef.current.off(event, listenersRef.current.get(event));
      }

      // Add new listener
      socketRef.current.on(event, callback);
      listenersRef.current.set(event, callback);
    }
  }, []);

  // Function to remove event listeners
  const off = useCallback((event) => {
    if (socketRef.current && listenersRef.current.has(event)) {
      socketRef.current.off(event, listenersRef.current.get(event));
      listenersRef.current.delete(event);
    }
  }, []);

  // Function to emit events
  const emit = useCallback(
    (event, data) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit(event, data);
      } else {
        console.warn("⚠️ Cannot emit event - socket not connected:", event);
      }
    },
    [isConnected]
  );

  // Function to send ping
  const ping = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("ping");
    }
  }, [isConnected]);

  return {
    isConnected,
    connectionError,
    on,
    off,
    emit,
    ping,
  };
};

export default useSocket;
