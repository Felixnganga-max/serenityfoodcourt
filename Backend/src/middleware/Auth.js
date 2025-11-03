const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models/sales");

// =============================================
// AUTH MIDDLEWARE
// =============================================

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

// Role-based middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

// Check if user can view sales (their own or if they have temporary access)
exports.canViewSales = async (req, res, next) => {
  try {
    const { date } = req.query;
    const today = new Date().toISOString().split("T")[0];

    // Manager can view all
    if (req.user.role === "manager") {
      return next();
    }

    // Staff can only view today's sales
    if (date && date !== today) {
      return res.status(403).json({
        success: false,
        error: "You can only view today's sales",
      });
    }

    // Check temporary access
    const user = await User.findById(req.user.id);
    const now = new Date();

    const hasTemporaryAccess = user.temporaryAccess.some((access) => {
      const start = new Date(access.startDate);
      const end = new Date(access.endDate);
      return now >= start && now <= end;
    });

    if (hasTemporaryAccess) {
      req.canViewOthers = true;
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
