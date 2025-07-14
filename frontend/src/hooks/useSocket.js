// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const useSocket = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const isConnectingRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    if (!userId || isConnectingRef.current) {
      return;
    }

    console.log("🔧 useSocket: Initializing socket for user:", userId);

    // Prevent multiple connections
    isConnectingRef.current = true;

    // Clean up existing connection
    if (socketRef.current) {
      console.log("🧹 useSocket: Cleaning up existing socket connection");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Fix: Get the base URL without /api
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    // Remove /api from the end if it exists
    const socketUrl = baseUrl.replace(/\/api$/, '');
    console.log("🔧 useSocket: Connecting to socket URL:", socketUrl);

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

    // Enhanced connection event handlers
    socket.on("connect", () => {
      console.log("✅ useSocket: Socket connected successfully");
      console.log("   - Socket ID:", socket.id);
      console.log("   - Transport:", socket.io.engine.transport.name);

      setIsConnected(true);
      setConnectionError(null);
      isConnectingRef.current = false;

      // Join user's room for targeted notifications
      socket.emit("join", userId);
      console.log("📡 useSocket: Emitted join event for user:", userId);
    });

    socket.on("joined", (data) => {
      console.log("✅ useSocket: Successfully joined room:", data);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ useSocket: Socket disconnected:", reason);
      setIsConnected(false);
      isConnectingRef.current = false;

      // Only emit leave if socket is still connected
      if (socket.connected) {
        socket.emit("leave", userId);
        console.log("📡 useSocket: Emitted leave event for user:", userId);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ useSocket: Socket connection error:", error.message);
      console.error("   - Error type:", error.type);
      console.error("   - Error description:", error.description);

      setIsConnected(false);
      isConnectingRef.current = false;

      // Handle specific error types
      if (error.message.includes("Invalid namespace")) {
        setConnectionError("Configuration error. Please contact support.");
      } else if (error.message.includes("timeout")) {
        setConnectionError("Connection timeout. Retrying...");
      } else {
        setConnectionError("Connection error. Retrying...");
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 useSocket: Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionError(null);
      isConnectingRef.current = false;

      // Rejoin user's room
      socket.emit("join", userId);
      console.log("📡 useSocket: Re-emitted join event for user:", userId);
    });

    socket.on("reconnect_error", (error) => {
      console.error("❌ useSocket: Socket reconnection error:", error);
      setConnectionError("Reconnection failed. Retrying...");
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ useSocket: Socket reconnection failed completely");
      setConnectionError("Connection failed. Please refresh the page.");
      isConnectingRef.current = false;
    });

    // Handle pong response
    socket.on("pong", () => {
      console.log("🏓 useSocket: Received pong from server");
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
          console.log("📡 useSocket: Emitted leave event during cleanup for user:", userId);
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
      isConnectingRef.current = false;
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
        console.warn("⚠️ useSocket: Cannot emit event - socket not connected:", event);
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