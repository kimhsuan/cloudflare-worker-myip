/**
 * Utility functions for IP address validation and extraction.
 */

/**
 * Validates and cleans an IP address from a raw string.
 * Supports IPv4 and IPv6 formats.
 * @param raw - The raw IP string from headers.
 * @returns The validated IP address or 'Unknown' if invalid.
 */
export default function validateAndCleanIP(raw: string): string {
  // Basic IPv4 pattern: four octets 0-255 (not strictly range‑validated here; this is
  // intentionally lightweight—exact 0-255 enforcement would need extra checks).
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  // Simplified IPv6 validation: allows hex + colons (compressed forms). We do not attempt
  // exhaustive canonical validation—just a sanity filter to block obvious garbage / control chars.
  const ipv6 = /^[0-9a-f:]+$/i;

  // Trim surrounding whitespace and remove any CR/LF to avoid log/header injection attempts.
  const cleaned = raw.trim().replace(/[\r\n]/g, '');

  // Decide if the cleaned value looks like an IPv4 or IPv6 address. For IPv6 we also require
  // at least one colon to reduce false positives (e.g. a pure hex string without colons).
  const isValid = ipv4.test(cleaned) || (cleaned.includes(':') && ipv6.test(cleaned));

  // Use validated IP or fall back to a neutral placeholder.
  return isValid ? cleaned : 'Unknown';
}
