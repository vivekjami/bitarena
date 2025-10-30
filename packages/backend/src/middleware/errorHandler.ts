import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class with HTTP status code
 */
export class HttpError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create HTTP error shortcuts
 */
export const createError = {
  badRequest: (message: string) => new HttpError(message, 400),
  unauthorized: (message: string) => new HttpError(message, 401),
  forbidden: (message: string) => new HttpError(message, 403),
  notFound: (message: string) => new HttpError(message, 404),
  conflict: (message: string) => new HttpError(message, 409),
  internal: (message: string) => new HttpError(message, 500),
};

/**
 * Global error handler middleware
 * Must be registered last after all routes
 */
export const errorHandler = (
  error: Error | HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 if not an HttpError
  const statusCode = (error as HttpError).statusCode || 500;
  const message = error.message || 'Internal server error';
  
  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      statusCode,
      message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    // Log minimal info in production
    console.error(`Error ${statusCode}: ${message}`);
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

/**
 * Catch-all 404 handler
 * Register before errorHandler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
