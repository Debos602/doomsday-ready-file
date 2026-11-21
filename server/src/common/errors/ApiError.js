class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static notFound(message) {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(code, message) {
    return new ApiError(409, code, message);
  }
}

module.exports = ApiError;
