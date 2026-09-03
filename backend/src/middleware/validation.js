/**
 * Request Validation Middleware for Phase 11 Security Hardening
 *
 * Provides reusable validation functions for route parameters and query strings.
 */

import { z } from 'zod';

/**
 * Validates that a string is a valid UUID
 */
const uuidSchema = z.string().uuid();

/**
 * Validates route parameter is a valid UUID
 * @param {string} paramName - Name of the parameter to validate
 * @param {string} paramLocation - Where to find the param (params, query, body)
 */
export function validateUUID(paramName, paramLocation = 'params') {
  return (req, res, next) => {
    const value = req[paramLocation]?.[paramName];

    if (!value) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: `${paramName} is required.`,
        },
      });
    }

    const result = uuidSchema.safeParse(value);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UUID_FORMAT',
          message: `${paramName} must be a valid UUID format.`,
        },
      });
    }

    next();
  };
}

/**
 * Validates pagination query parameters
 */
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().max(100)).optional(),
});

/**
 * Validates search query parameter for RAG
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().int().min(1).max(20).optional().default(5),
  matchThreshold: z.number().min(0).max(1).optional().default(0.15),
});

/**
 * Validates runId parameter
 */
export function validateRunId(req, res, next) {
  return validateUUID('runId', 'params')(req, res, next);
}

/**
 * Validates exceptionId parameter
 */
export function validateExceptionId(req, res, next) {
  return validateUUID('exceptionId', 'params')(req, res, next);
}

/**
 * Middleware to validate request body against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body validation failed.',
          details: errors,
        },
      });
    }

    req.body = result.data;
    next();
  };
}

/**
 * Validates date string is ISO 8601 format
 */
export function validateISODate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}

/**
 * Validates amount is a positive number with 2 decimal places
 */
export function validateMoneyAmount(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) return false;

  // Check for 2 decimal places
  const str = num.toFixed(2);
  return parseFloat(str) === num;
}

/**
 * Sanitize string input to prevent injection
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

export default {
  validateUUID,
  validateRunId,
  validateExceptionId,
  validateBody,
  paginationSchema,
  searchQuerySchema,
  validateISODate,
  validateMoneyAmount,
  sanitizeInput,
};