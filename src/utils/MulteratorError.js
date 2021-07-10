class MulteratorError extends Error {
  constructor(message, code, info) {
    super(message);
    this.code = code;
    this.info = info;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = MulteratorError;
