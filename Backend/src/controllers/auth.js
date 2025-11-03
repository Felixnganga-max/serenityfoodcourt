const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models/sales");

// =============================================
// AUTH CONTROLLER
// =============================================

// Register new user (Manager only)
exports.register = async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;

    // Check if requester is manager
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        error: "Only managers can create new users",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Username already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      password: hashedPassword,
      fullName,
      role,
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update user status (Manager only)
exports.updateUserStatus = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        error: "Only managers can update user status",
      });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Assign temporary access (Manager only)
exports.assignTemporaryAccess = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        error: "Only managers can assign temporary access",
      });
    }

    const { coveringUserId, coveredUserId, startDate, endDate, reason } =
      req.body;

    const coveringUser = await User.findById(coveringUserId);
    if (!coveringUser) {
      return res.status(404).json({
        success: false,
        error: "Covering user not found",
      });
    }

    coveringUser.temporaryAccess.push({
      userId: coveredUserId,
      startDate,
      endDate,
      reason,
    });

    await coveringUser.save();

    res.json({
      success: true,
      data: coveringUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Remove temporary access (Manager only)
exports.removeTemporaryAccess = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        error: "Only managers can remove temporary access",
      });
    }

    const { coveringUserId, accessId } = req.params;

    const user = await User.findById(coveringUserId);
    user.temporaryAccess = user.temporaryAccess.filter(
      (access) => access._id.toString() !== accessId
    );

    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all users (Manager only)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        error: "Only managers can view all users",
      });
    }

    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

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
