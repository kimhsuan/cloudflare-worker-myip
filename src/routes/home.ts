import validateAndCleanIP from '../utils/ip';

/**
 * Home route handler.
 * Returns the client's IP address (as seen by Cloudflare) in plain text.
 *
 * Security / reliability notes:
 *  - Trusts `CF-Connecting-IP` only (set by Cloudflare in production). In non-Cloudflare
 *    environments this header can be spoofed; we defensively validate basic IP syntax.
 *  - Output is plain text with safe headers to avoid content sniffing issues.
 *  - Falls back to the literal string "Unknown" if the header is absent or malformed.
 */
export default async (request: Request) => {
  // Defensive: if request is somehow undefined, return a clear message
  if (!request) {
    return new Response('Request object is missing', { status: 500 });
  }

  // Raw value from Cloudflare's connecting IP header. Empty string if absent.
  const raw = request.headers.get('CF-Connecting-IP') || '';

  // Use validated IP or fall back to a neutral placeholder.
  const value = validateAndCleanIP(raw);

  // Respond with the IP (or placeholder) as plain text. Cache disabled to ensure accuracy.
  return new Response(value, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
};
