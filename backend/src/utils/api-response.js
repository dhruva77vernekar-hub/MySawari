export function success(res, data, status = 200, meta = {}) {
  return res.status(status).json({
    success: true,
    data,
    meta: { requestId: res.locals.requestId, ...meta }
  });
}

export function failure(res, status, code, message, details = []) {
  return res.status(status).json({
    success: false,
    error: { code, message, details },
    meta: { requestId: res.locals.requestId }
  });
}
