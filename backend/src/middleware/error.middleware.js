import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { failure } from '../utils/api-response.js';
import { env } from '../config/env.js';

export function notFoundMiddleware(req, res) {
  return failure(res, 404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} was not found.`);
}

export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
    return failure(res, 422, 'VALIDATION_ERROR', 'Please check the submitted information.', details);
  }

  if (error?.type === 'entity.parse.failed') {
    return failure(res, 400, 'INVALID_JSON', 'The request body contains invalid JSON.');
  }

  if (error?.type === 'entity.too.large') {
    return failure(res, 413, 'REQUEST_TOO_LARGE', 'The request body exceeds the allowed size.');
  }

  const known = error instanceof AppError;
  const status = known ? error.statusCode : 500;
  const code = known ? error.code : 'INTERNAL_SERVER_ERROR';
  const message = known ? error.message : 'An unexpected server error occurred.';
  const details = known ? error.details : [];

  req.log?.[status >= 500 ? 'error' : 'warn']?.({
    err: error,
    requestId: res.locals.requestId,
    status
  }, 'Request failed');

  if (env.NODE_ENV !== 'production' && !known) {
    return failure(res, status, code, message, [{ debugMessage: error.message }]);
  }
  return failure(res, status, code, message, details);
}
