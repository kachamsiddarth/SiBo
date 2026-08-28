/**
 * Centralized Error Handling Middleware for Express
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || res.statusCode || 500;
  
  // Log error internally (with stack trace for backend logs only)
  console.error(`[ERROR] ${req.method} ${req.url} - Status: ${statusCode}`);
  console.error(err.stack || err.message || err);

  // Return safe client-facing error payload without leaking internal stack traces or secrets
  res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
    success: false,
    error: {
      message: err.isPublic ? err.message : (statusCode === 500 ? 'Internal Server Error' : err.message),
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    }
  });
}
