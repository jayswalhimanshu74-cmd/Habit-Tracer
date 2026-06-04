const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id; // ✅ attach verified user ID to socket
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
};