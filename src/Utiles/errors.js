// Custom Error Classes
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, code = "VAL_001") {
    super(message, 400, code);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message, code = "AUTH_001") {
    super(message, 401, code);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message, code = "NOT_001") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message, code = "FOR_001") {
    super(message, 403, code);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message, code = "CON_001") {
    super(message, 409, code);
    this.name = "ConflictError";
  }
}
