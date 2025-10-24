// Simple authentication middleware (you can enhance this later)
const authenticate = (req, res, next) => {
  // For now, we'll just pass through
  // In production, implement proper JWT or session auth
  next();
};

module.exports = { authenticate };