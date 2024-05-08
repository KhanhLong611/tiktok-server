class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Add a .stack property to the instance of AppError from the point the error occurred in the code
    Error.captureStackTrace(this, this.constructor);
  }
}

// Make properties enumerable
Object.defineProperty(AppError.prototype, "message", {
  enumerable: true,
  writable: true,
});

module.exports = AppError;
