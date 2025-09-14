import { config } from './config';
import { errorResponse } from './utils/responses';
import { ErrorCodes } from './errors';

/**
 * CORS helper utilities
 * --------------------------------------------------------------
 * This module centralises all logic for deciding whether (and how)
 * to emit CORS headers. We follow these principles:
 *  1. Never emit Access-Control-Allow-Origin if the request has no Origin
 *     header (those are usually non-browser / same-origin / server calls).
 *  2. Support four origin strategies via config.host:
 *       - '*' : allow any origin (NOT compatible with credentials)
 *       - ':origin' : reflect the exact incoming Origin (wide open; use carefully)
 *       - 'https://single.example' : allow only this exact origin
 *       - ['https://a.example','https://b.example'] : allowlisted set
 *  3. When credentials are enabled (allowCredentials = true) we must not
 *     return '*'. The code does not auto-downgrade, so configuration should
 *     enforce this invariant externally (we could add a console.warn if desired).
 *  4. We add Vary: Origin whenever the ACAO value can differ per request
 *     (anything except a literal '*'). This keeps caches correct.
 *  5. Preflight (OPTIONS) responses mirror the same decision path so that the
 *     browser's CORS cache remains consistent with normal responses.
 */

/**
 * Decide which value (if any) should be used for Access-Control-Allow-Origin.
 * Algorithm:
 *   - If no Origin header: return null (do not emit CORS headers)
 *   - If host is an array: allow only exact matches
 *   - If host === '*': allow any (return '*')
 *   - If host === ':origin': reflect the request's Origin
 *   - Else host is a single fixed origin: return it only on exact match
 */
function resolveAllowOrigin(request: Request): string | null {
  const originHeader = request.headers.get('Origin');
  if (!originHeader) return null; // Never emit CORS headers without an Origin

  const hostConfig = config.host as typeof config.host;

  // Allowlist (array of exact origins)
  if (Array.isArray(hostConfig)) {
    return hostConfig.includes(originHeader) ? originHeader : null;
  }
  // Wildcard (still only when an Origin is present)
  if (hostConfig === '*') return '*';
  // Reflection mode
  if (hostConfig === ':origin') return originHeader;
  // Single fixed origin
  return originHeader === hostConfig ? hostConfig : null;
}

/**
 * Apply CORS headers to a normal (non-OPTIONS) response.
 * We only set headers that are absent to avoid clobbering upstream values.
 * Added headers:
 *   - Access-Control-Allow-Origin (conditionally)
 *   - Access-Control-Allow-Credentials (if enabled & not '*')
 *   - Vary: Origin (if ACAO is dynamic / not '*')
 *   - Access-Control-Allow-Methods (informational for simple requests)
 *   - Access-Control-Allow-Headers (minimal; extend if you accept more)
 */
export function applyCors(request: Request, response: Response): Response {
  const origin = resolveAllowOrigin(request);
  const headers = new Headers(response.headers);
  if (origin) {
    if (!headers.has('Access-Control-Allow-Origin')) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
    if (config.allowCredentials && origin !== '*') {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }
    // Add Vary: Origin for cache correctness if not wildcard
    if (origin !== '*') {
      const vary = headers.get('Vary');
      if (vary) {
        if (!/\bOrigin\b/i.test(vary)) headers.set('Vary', `${vary}, Origin`);
      } else {
        headers.set('Vary', 'Origin');
      }
    }
  }
  // Expose the methods we actually allow (informational for clients)
  if (!headers.has('Access-Control-Allow-Methods')) {
    headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
  }
  // Allow common request headers; extend if you later accept Authorization, etc.
  if (!headers.has('Access-Control-Allow-Headers')) {
    headers.set('Access-Control-Allow-Headers', config.allowHeaders.join(', '));
  }
  if (config.exposeHeaders && config.exposeHeaders.length) {
    headers.set(
      'Access-Control-Expose-Headers',
      config.exposeHeaders.join(', '),
    );
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Build an OPTIONS preflight response that mirrors the same origin decision
 * logic and includes method/header allowances plus a Max-Age to reduce repeated
 * preflights. We return 204 (No Content) to keep responses lean.
 */
export function buildPreflightResponse(request: Request): Response {
  const origin = resolveAllowOrigin(request);
  const headers = new Headers();
  if (origin) headers.set('Access-Control-Allow-Origin', origin);

  // Requested method validation
  const acrm = request.headers.get('Access-Control-Request-Method');
  if (acrm && !config.methods.includes(acrm.toUpperCase())) {
    return errorResponse(
      405,
      ErrorCodes.METHOD_NOT_ALLOWED,
      `Method ${acrm} not allowed`,
    );
  }

  headers.set('Access-Control-Allow-Methods', config.methods.join(', '));

  // Requested headers validation
  const reqHeaders = request.headers.get('Access-Control-Request-Headers');
  const allowedLower = config.allowHeaders.map((h) => h.toLowerCase());
  if (reqHeaders) {
    const requested = reqHeaders
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    for (const h of requested) {
      if (!allowedLower.includes(h.toLowerCase())) {
        return errorResponse(
          400,
          ErrorCodes.CORS_HEADER_NOT_ALLOWED,
          `CORS header not allowed: ${h}`,
        );
      }
    }
    // Reflect only what was requested (browser caches per combination)
    headers.set('Access-Control-Allow-Headers', requested.join(', '));
  } else {
    headers.set('Access-Control-Allow-Headers', config.allowHeaders.join(', '));
  }

  headers.set(
    'Access-Control-Max-Age',
    String(
      config.maxAge !== null && config.maxAge !== undefined
        ? config.maxAge
        : 86400,
    ),
  );
  if (config.allowCredentials && origin && origin !== '*') {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  if (config.exposeHeaders && config.exposeHeaders.length) {
    headers.set(
      'Access-Control-Expose-Headers',
      config.exposeHeaders.join(', '),
    );
  }
  if (origin && origin !== '*') headers.set('Vary', 'Origin');
  return new Response(null, { status: 204, headers });
}
