export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string>) {
    super(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tiene permisos para realizar esta acción') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(404, 'NOT_FOUND', `${resource} no encontrado`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'BUSINESS_RULE', message, details);
  }
}
