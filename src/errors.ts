/**
 * Centralised error code definitions for consistent API error responses.
 * Add new codes here and reference them across route handlers.
 */
export const ErrorCodes = {
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  ENV_PLATFORM_METADATA_MISSING: 'ENV_PLATFORM_METADATA_MISSING',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CORS_HEADER_NOT_ALLOWED: 'CORS_HEADER_NOT_ALLOWED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** Shape for a standardised error payload */
export interface StandardErrorBody {
  success: false;
  code: ErrorCode;
  message: string;
}
