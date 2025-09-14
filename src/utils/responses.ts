import { ErrorCode } from '../errors';

/** Shared immutable JSON headers for all JSON API responses. */
export const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json;charset=UTF-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
});

// Success responses now return the raw payload (no wrapper object)

/** Standard error body shape (no success flag) */
export interface ErrorBody {
  code: ErrorCode;
  message: string;
  // Allow arbitrary extra debug / context fields (e.g. traceId)
  [key: string]: unknown;
}

/** Build a standardized JSON error response. */
export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  const body: ErrorBody = { code, message, ...(extra || {}) };
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** Build a standardized JSON success response (optional helper). */
export function successResponse<T>(
  data: T,
  init?: ResponseInit,
  pretty: number | boolean = 2,
): Response {
  let space;
  if (typeof pretty === 'number') {
    space = pretty;
  } else {
    space = pretty ? 2 : undefined;
  }
  return new Response(JSON.stringify(data, null, space), {
    ...(init || {}),
    headers: JSON_HEADERS,
  });
}

/**
 * Build a 204 No Content response (no body) with optional headers.
 * Adds minimal safety/cache headers if not already present.
 * Note: CORS headers (if any) are added by the outer applyCors layer for
 * non-preflight OPTIONS only if you route through it. Preflight stays handled
 * by buildPreflightResponse.
 */
export function noContentResponse(
  init?: Omit<ResponseInit, 'status'>,
): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has('cache-control')) headers.set('cache-control', 'no-store');
  if (!headers.has('x-content-type-options')) {
    headers.set('x-content-type-options', 'nosniff');
  }
  return new Response(null, {
    ...init,
    status: 204,
    headers,
  });
}
