require("dotenv").config(); // Load env first, always first

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const userProfileRoutes = require("./routes/userProfileRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const projectRoutes = require("./routes/projectRoutes");
const aiRoutes = require("./routes/aiRoutes");
const connectDB = require("./config/db");
require("./config/firebase");

const app = express();
const server = http.createServer(app);
const { initializeSocket, getIo } = require("./socket");

const io = initializeSocket(server);

const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://advance-to-do-list-app.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

// Logging middleware
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Connect DB
connectDB();

// IMPORTANT: Razorpay routes handle their own body parsing
// - /initiate-payment uses bodyParser.json()
// - /webhook uses bodyParser.raw()
app.use("/api/razorpay", razorpayRoutes);

// Other routes with JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const pushRoutes = require("./routes/pushRoutes");

const todoRoutes = require("./routes/todolist");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/push", pushRoutes);
app.use("/api/user", userProfileRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (_, res) => res.send("🖐️ Hello from Express backend!"));

// Error Handler
app.use((err, req, res, next) => {
  console.error("Express Error:", err.stack);
  res.status(500).send("Something broke! Check logs.");
});

// Socket + Scheduler
const startNotificationScheduler = require("./scheduler/notificationScheduler");
startNotificationScheduler();

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔧 Environment variables check:`);
  console.log(
    `   - RAZORPAY_API_KEY: ${
      process.env.RAZORPAY_API_KEY ? "✅ Set" : "❌ Missing"
    }`
  );
  console.log(
    `   - RAZORPAY_SECRET_KEY: ${
      process.env.RAZORPAY_SECRET_KEY ? "✅ Set" : "❌ Missing"
    }`
  );
  console.log(
    `   - RAZORPAY_WEBHOOK_SECRET: ${
      process.env.RAZORPAY_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing"
    }`
  );
  console.log("🔧 Socket.IO Configuration:");
  console.log("   - Transports: websocket, polling");
  console.log("   - CORS Origins:", [
    "http://localhost:5173",
    "https://advance-to-do-list-app.vercel.app",
  ]);
  console.log("   - Namespace: / (default)");
});
