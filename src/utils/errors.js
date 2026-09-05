export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function notFound(message = 'Not found') {
  return new AppError(message, 404);
}

export function badRequest(message) {
  return new AppError(message, 400);
}

export function conflict(message) {
  return new AppError(message, 409);
}
