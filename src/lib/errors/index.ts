/**
 * Custom Error Classes
 * 
 * These provide semantic error types that can be caught and handled
 * differently throughout the application.
 */

export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    // Capture stack trace if available (Node.js feature)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, public readonly field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export class BadRequestError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

/**
 * Framework Compatibility Warning Suppressor
 * 
 * Handles known framework compatibility warnings that don't affect functionality.
 * Currently suppresses Next.js 15 async API warnings from NextAuth v4.
 */
export class FrameworkCompatibilityWarning {
  private static readonly SUPPRESSED_WARNINGS = [
    'params.nextauth',
    'cookies().getAll()',
    '...headers()',
    'sync-dynamic-apis'
  ];

  /**
   * Determines if a warning should be suppressed
   */
  static shouldSuppress(error: Error | unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const message = error.message || '';
    return this.SUPPRESSED_WARNINGS.some(warning => 
      message.includes(warning)
    );
  }

  /**
   * Logs suppressed warnings in development mode only
   */
  static logIfDev(error: Error | unknown): void {
    if (process.env.NODE_ENV === 'development' && this.shouldSuppress(error)) {
      // These are known NextAuth v4 + Next.js 15 compatibility warnings
      // They don't affect functionality - upgrade to NextAuth v5 to resolve
      console.debug('[Framework Compatibility] Suppressed warning:', error);
    }
  }

  /**
   * Wraps a handler to catch and suppress framework warnings
   */
  static suppressWarnings<T>(fn: () => T): T {
    try {
      return fn();
    } catch (error) {
      if (this.shouldSuppress(error)) {
        this.logIfDev(error);
        throw error; // Re-throw but mark as handled
      }
      throw error;
    }
  }
}

