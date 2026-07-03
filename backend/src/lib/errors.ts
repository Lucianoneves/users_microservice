export class ConflictError extends Error {
  constructor(message = 'User already exists') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
