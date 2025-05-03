const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const userRoutes = require('./routes/user');
const todoRoutes = require('./routes/todolist');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing request bodies
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
  origin: ["http://localhost:4173", "http://localhost:3000"],
  credentials: false, // Changed to false to match frontend config
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Parse JSON request body
app.use(express.json());

connectDB();

app.get('/', (_, res) => {
  res.send('🖐️ Hello from the Express backend!');
});

app.use('/api/user', userRoutes);
app.use('/api/todolist', todoRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
