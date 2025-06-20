require('dotenv').config(); // Load env first, always first

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { handleWebhook } = require('./controller/razorpayController');
const userProfileRoutes = require('./routes/userProfileRoutes');
const todoRoutes = require('./routes/todolist');
const notificationRoutes = require('./routes/notificationRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const projectRoutes = require('./routes/projectRoutes');
const connectDB = require('./config/db');
require('./config/firebase');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://advance-to-do-list-app.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }
});

const PORT = process.env.PORT || 5000;

// Razorpay webhook must use raw body parser FIRST
app.post(
  '/api/razorpay/webhook',
  bodyParser.raw({ type: 'application/json' }),
  handleWebhook
);

// Now apply express.json() and other parsers
app.use(cors({
  origin: ["http://localhost:5173", "https://advance-to-do-list-app.vercel.app"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json()); // Don't parse webhook body with this!
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Connect DB
connectDB();

// Routes
app.use('/api/user', userProfileRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/razorpay', razorpayRoutes); // This contains /initiate-payment
app.use('/api/projects', projectRoutes);

app.get('/', (_, res) => res.send('🖐️ Hello from Express backend!'));

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! Check logs.');
});

// Socket + Scheduler
module.exports = { io };
const startNotificationScheduler = require('./scheduler/notificationScheduler');
startNotificationScheduler(io);

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
