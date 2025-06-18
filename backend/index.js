const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const userProfileRoutes = require('./routes/userProfileRoutes');
const todoRoutes = require('./routes/todolist');
const notificationRoutes = require('./routes/notificationRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const projectRoutes = require('./routes/projectRoutes');
const connectDB = require('./config/db');
const startNotificationCleanup = require('./scheduler/notificationScheduler');
require('./config/firebase'); // Initialize Firebase Admin SDK


// Load environment variables
dotenv.config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://advance-to-do-list-app.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true // Set credentials to true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware for parsing request bodies
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
  origin: ["http://localhost:5173", "https://advance-to-do-list-app.vercel.app"],
  credentials: true, // Changed to true to match frontend config
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Parse JSON request body
app.use(express.json());
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

connectDB();

app.get('/', (_, res) => {
  res.send('🖐️ Hello from the Express backend!');
});

app.use('/api/user', userProfileRoutes);

app.use((err, req, res, next) => {
  console.error(err); // Log the entire error object
  console.error(err.stack); // Log the error stack to the server console
  res.status(500).send('Something broke! Check server logs for details.');
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = { io };

// Routes that use the 'io' object should be required after 'io' is exported
app.use('/api/todos', todoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/razorpay', bodyParser.raw({ type: 'application/json' }), razorpayRoutes);
app.use('/api/projects', projectRoutes);

const startNotificationScheduler = require('./scheduler/notificationScheduler');
startNotificationScheduler(io);
// Ensure io is initialized before requiring controllers that use it
// This line is intentionally placed after io initialization
// const todoController = require('./controller/todoController'); // This line is not needed here, as routes already require it.
