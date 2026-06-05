const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const socketAuth = require('./middleware/socketAuth');
const authRoutes = require('./routes/authRoutes');
const habitRoutes = require('./routes/habitRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const insightRoutes = require('./routes/insightRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
app.use(helmet());
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// --- Same corsOptions object used in two places ---
const corsOptions = {
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

  // ✅ Use the verified userId from the token — don't trust client input
  socket.join(socket.userId);
  console.log(`User ${socket.userId} joined their room`);

  // ✅ Remove the 'join' handler entirely — client can no longer
  //    spoof a different userId to join someone else's room
  // socket.on('join', ...) — DELETED

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

app.use(cors(corsOptions)); // ✅ was: app.use(cors()) — allowed *
app.use(express.json());




// Pass io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);


// Socket logic
const PORT = process.env.PORT || 8000;


if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // ✅
