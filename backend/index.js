require('dotenv').config(); // Load env first, always first

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { handleWebhook } = require('./controller/razorpayController');
const userProfileRoutes = require('./routes/userProfileRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes');
const connectDB = require('./config/db');
require('./config/firebase');

const app = express();
const server = http.createServer(app);
const { initializeSocket, getIo } = require('./socket');

const io = initializeSocket(server);

const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "https://advance-to-do-list-app.vercel.app"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Connect DB
connectDB();

// Routes
const todoRoutes = require('./routes/todolist');
const notificationRoutes = require('./routes/notificationRoutes');

// Regular routes with JSON parsing
app.use(express.json());

app.use('/api/user', userProfileRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);

// Razorpay routes - this will handle both /initiate-payment and /webhook
app.use('/api/razorpay', razorpayRoutes);

app.get('/', (_, res) => res.send('🖐️ Hello from Express backend!'));

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! Check logs.');
});

// Socket + Scheduler
const startNotificationScheduler = require('./scheduler/notificationScheduler');
startNotificationScheduler();

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});