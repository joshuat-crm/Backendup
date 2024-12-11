const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee"); // Add this import

// Wrapper for async middleware to catch errors
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Enhanced error handler
const handleError = (res, error, message, statusCode = 500) => {
  console.error(`${message}:`, error);
  return res.status(statusCode).json({
    success: false,
    message: message,
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "An error occurred",
  });
};

// JWT verification middleware
const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided, authorization denied",
    });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }
    throw error;
  }
});

// Middleware to check if the user is an Admin
const isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  next();
});

// Middleware to check if the user is a Manager or Admin
const isManager = asyncHandler(async (req, res, next) => {
  // Check if user is Admin first
  if (req.user.role === "Admin") {
    return next();
  }

  // Check if user is an Employee with Manager designation
  if (req.user.role === "Employee") {
    const employee = await Employee.findOne({
      user: req.user._id,
      designation: "Manager",
    });

    if (employee) {
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    message:
      "Access denied. Only Managers and Admins can access this resource.",
  });
});

// Middleware to check user status
const checkUserStatus = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User authentication required",
    });
  }

  switch (req.user.status) {
    case "inactive":
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    case "active":
      return next();
    default:
      return res.status(400).json({
        success: false,
        message: "Invalid account status",
      });
  }
});

// Middleware to check ownership or admin status
const isOwnerOrAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (req.user.role === "Admin" || req.user._id.toString() === id) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. You can only access your own data.",
  });
});

// Middleware to check if user is an Investor
const isInvestor = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "Investor") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Investors only.",
    });
  }
  next();
});

// Middleware to check if user is a Customer
const isCustomer = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "Customer") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Customers only.",
    });
  }
  next();
});

// Middleware compositor for role-based access
const hasRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${roles.join(", ")}`,
      });
    }
    next();
  });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected error occurred",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = {
  verifyJWT,
  isAdmin,
  isManager,
  checkUserStatus,
  isOwnerOrAdmin,
  isInvestor,
  isCustomer,
  hasRole,
  errorHandler,
};
