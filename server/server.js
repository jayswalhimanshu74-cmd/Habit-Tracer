const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const socketAuth = require('./middleware/socketAuth');
const authRoutes = require('./routes/authRoutes');
const { authLimiter } = require('./middleware/rateLimiter');
const habitRoutes = require('./routes/habitRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const insightRoutes = require('./routes/insightRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();

// Enable trust proxy for rate limiting behind reverse proxies (e.g. Vercel)
app.set('trust proxy', 1);

app.use(helmet());

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      origin === CLIENT_URL ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});
io.use(socketAuth); 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.join(socket.userId);
  console.log(`User ${socket.userId} joined their room`);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

app.use(cors(corsOptions));
app.use(express.json());

// Pass io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoints
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'HabitTracker API is operational' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

// API 404 Handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});


// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 8000;

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

