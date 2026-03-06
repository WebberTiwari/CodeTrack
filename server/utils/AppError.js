// Custom operational error class.
// "Operational" errors are expected (404, 401, validation failures etc.)
// as opposed to programming bugs — the global error handler treats them differently.
//
// Usage:
//   throw new AppError("Problem not found", 404);
//   throw new AppError("Invalid email or password", 401);

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode    = statusCode;
    this.status        = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // flag so global handler knows it's a known error

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;