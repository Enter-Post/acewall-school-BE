import { AppError } from "../Utiles/errors.js";

// asyncHandler wrapper for controllers
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("Error:", err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errorCode = err.code || "ERR_001";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = err.code || "VAL_001";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errorCode = "CAST_001";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate field value entered";
    errorCode = "DUP_001";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    errorCode = "JWT_001";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    errorCode = "JWT_002";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: true,
    message,
    code: errorCode,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
