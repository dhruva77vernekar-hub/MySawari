import { randomUUID } from 'node:crypto';

export function requestIdMiddleware(req, res, next) {
  const supplied = req.get('x-request-id');
  const requestId = supplied && /^[a-zA-Z0-9._-]{1,100}$/.test(supplied)
    ? supplied
    : randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
