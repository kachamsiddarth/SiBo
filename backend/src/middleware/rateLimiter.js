/**
 * Rate Limiting Middleware for Phase 11 Security Hardening
 *
 * Protects expensive endpoints from abuse while allowing normal demo workflow.
 * Uses express-rate-limit with different configurations per endpoint type.
 */

import rateLimit from 'express-rate-limit';

/**
 * Default rate limiter for general API endpoints
 * 
 * 
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  keyGenerator: (req) => req.ip,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.url === '/api/health';
  },
});

/**
 * Strict rate limiter for expensive AI endpoints
 * 5 requests per 15 minutes per IP
 * Groq LLM calls are expensive and slow
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Too many AI investigation requests. Please wait before trying again.',
    },
  },
  keyGenerator: (req) => {
    // Rate limit per exception ID to prevent repeated investigations
    const exceptionId = req.params.exceptionId || 'unknown';
    return `${req.ip}:${exceptionId}`;
  },
});

/**
 * Rate limiter for RAG endpoints
 * 10 requests per 5 minutes per IP
 * RAG search uses HuggingFace embeddings + Supabase vector search
 */
export const ragLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RAG_RATE_LIMIT_EXCEEDED',
      message: 'Too many knowledge base requests. Please slow down.',
    },
  },
  keyGenerator: (req) => req.ip,
});

/**
 * Rate limiter for RAG ingestion (admin-like operation)
 * 2 requests per hour per IP
 * Ingestion is expensive and rarely needed
 */
export const ingestionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'INGESTION_RATE_LIMIT_EXCEEDED',
      message: 'Too many ingestion requests. This operation is rate-limited to prevent abuse.',
    },
  },
  keyGenerator: (req) => req.ip,
});

/**
 * Rate limiter for file uploads
 * 5 uploads per 15 minutes per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many upload attempts. Please wait before uploading again.',
    },
  },
  keyGenerator: (req) => req.ip,
});

/**
 * Rate limiter for reconciliation runs (compute-intensive)
 * 3 requests per 15 minutes per IP
 */
export const reconciliationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RECONCILIATION_RATE_LIMIT_EXCEEDED',
      message: 'Too many reconciliation requests. This is a compute-intensive operation.',
    },
  },
  keyGenerator: (req) => {
    // Rate limit per run ID to prevent repeated runs on same dataset
    const runId = req.params.runId || 'unknown';
    return `${req.ip}:${runId}`;
  },
});

/**
 * Create a custom rate limiter with specific options
 * @param {Object} options - Rate limit configuration
 * @returns {Function} Express middleware
 */
export function createCustomLimiter(options = {}) {
  const defaults = {
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
  };

  return rateLimit({
    ...defaults,
    ...options,
  });
}

export default {
  generalLimiter,
  aiLimiter,
  ragLimiter,
  ingestionLimiter,
  uploadLimiter,
  reconciliationLimiter,
  createCustomLimiter,
};
