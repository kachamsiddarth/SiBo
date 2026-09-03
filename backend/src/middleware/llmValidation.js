/**
 * LLM Output Validation Schema for Phase 11 Security Hardening
 *
 * Validates Groq LLM investigation output before persisting to database
 */

import { z } from 'zod';

/**
 * Schema for AI investigation result structure
 * Enforces that Groq output contains all required fields with proper types
 */
export const aiInvestigationSchema = z.object({
  summary: z.string()
    .min(10, 'Summary must be at least 10 characters')
    .max(1000, 'Summary must not exceed 1000 characters'),

  evidence: z.array(z.string())
    .min(1, 'At least one evidence item is required')
    .max(20, 'Evidence list cannot exceed 20 items'),

  reasoning: z.string()
    .min(20, 'Reasoning must be at least 20 characters')
    .max(2000, 'Reasoning must not exceed 2000 characters'),

  recommended_action: z.string()
    .min(10, 'Recommended action must be at least 10 characters')
    .max(500, 'Recommended action must not exceed 500 characters'),

  confidence: z.enum(['high', 'medium', 'low'], {
    errorMap: () => ({ message: 'Confidence must be one of: high, medium, low' }),
  }),

  sources_used: z.array(z.object({
    title: z.string(),
    section: z.string().optional(),
    url: z.string().url().optional(),
    similarity: z.number().min(0).max(1).optional(),
  })).optional().default([]),

  status: z.enum(['EXPLAINED', 'UNRESOLVED', 'MANUAL_REVIEW'])
    .optional()
    .default('EXPLAINED'),
});

/**
 * Validates LLM output against the investigation schema
 * @param {Object} output - Raw LLM output to validate
 * @returns {Object} Validation result with parsed data or errors
 */
export function validateAIInvestigation(output) {
  try {
    const result = aiInvestigationSchema.safeParse(output);

    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return {
        valid: false,
        errors,
        data: null,
      };
    }

    return {
      valid: true,
      errors: [],
      data: result.data,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ path: 'root', message: `Validation error: ${error.message}` }],
      data: null,
    };
  }
}

/**
 * Safely extracts structured output from LLM response
 * Handles cases where LLM returns malformed JSON or unexpected structure
 * @param {Object} llmResponse - Raw response from Groq
 * @returns {Object} Extracted and validated investigation data
 */
export function extractAIInvestigation(llmResponse) {
  // If response is already an object, use it directly
  let parsed = llmResponse;

  // If response is a string, attempt to parse as JSON
  if (typeof llmResponse === 'string') {
    try {
      parsed = JSON.parse(llmResponse);
    } catch (error) {
      throw new Error('LLM output is not valid JSON');
    }
  }

  // Validate against schema
  const validation = validateAIInvestigation(parsed);

  if (!validation.valid) {
    const errorDetails = validation.errors
      .map(e => `${e.path}: ${e.message}`)
      .join(', ');
    throw new Error(`LLM output validation failed: ${errorDetails}`);
  }

  return validation.data;
}

/**
 * Creates a safe fallback investigation result when LLM fails
 * @param {string} exceptionId - Exception being investigated
 * @param {Error} error - Original error that occurred
 * @returns {Object} Safe fallback investigation result
 */
export function createFailedInvestigationFallback(exceptionId, error) {
  return {
    summary: 'AI investigation could not be completed due to a system error.',
    evidence: ['LLM service unavailable or returned invalid output'],
    reasoning: `The AI investigation service encountered an error: ${error.message}. This exception requires manual review.`,
    recommended_action: 'Manual review required - AI investigation failed',
    confidence: 'low',
    sources_used: [],
    status: 'MANUAL_REVIEW',
    error_details: {
      error_type: error.name,
      error_message: error.message,
      exception_id: exceptionId,
    },
  };
}

export default {
  aiInvestigationSchema,
  validateAIInvestigation,
  extractAIInvestigation,
  createFailedInvestigationFallback,
};
