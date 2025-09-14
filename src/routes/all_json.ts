import { IPInfo } from '../interfaces/ipinfo';
import { ErrorCodes } from '../errors';
import { JSON_HEADERS, errorResponse, successResponse } from '../utils/responses';
import validateAndCleanIP from '../utils/ip';

const MAX_UA_LEN = 512;

export default async (request: Request) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return errorResponse(
      405,
      ErrorCodes.METHOD_NOT_ALLOWED,
      'Method not allowed',
    );
  }

  try {
    // Check if the request.cf object exists, which is a core feature of Cloudflare Workers
    if (!request.cf) {
      return errorResponse(
        500,
        ErrorCodes.ENV_PLATFORM_METADATA_MISSING,
        'Platform metadata unavailable',
      );
    }

    // For HEAD requests, we only need to confirm service availability & headers;
    // skip IP / UA parsing for efficiency and return immediately.
    if (request.method === 'HEAD') {
      return new Response(null, { status: 200, headers: JSON_HEADERS });
    }

    const rawIP = request.headers.get('CF-Connecting-IP') || '';
    const cleanedIP = validateAndCleanIP(rawIP);
    const isValidIP = cleanedIP !== 'Unknown';

    const ip = isValidIP ? cleanedIP : 'Unknown';

    let userAgent = request.headers.get('User-Agent') || 'N/A';
    if (userAgent.length > MAX_UA_LEN) {
      userAgent = `${userAgent.slice(0, MAX_UA_LEN)}…`;
    }

    // Destructure the required IP information from the request.cf object
    const asnCandidate: unknown = request.cf.asn;
    const asn = typeof asnCandidate === 'number'
      && Number.isFinite(asnCandidate)
      && asnCandidate > 0
      ? `AS${asnCandidate}`
      : 'N/A';

    const ipInfo: IPInfo = {
      ip,
      asn,
      as_org: request.cf.asOrganization || 'N/A',
      country: request.cf.country || 'N/A',
      region: request.cf.region || 'N/A',
      city: request.cf.city || 'N/A',
      latitude: request.cf.latitude || 'N/A',
      longitude: request.cf.longitude || 'N/A',
      timezone: request.cf.timezone || 'N/A',
      encoding: request.cf.clientAcceptEncoding || 'N/A',
      user_agent: userAgent,
    };

    // Successful GET response (standardised success envelope)
    return successResponse<IPInfo>(ipInfo, { status: 200 });
  } catch {
    // console.error('Error handling request:', error);
    return errorResponse(
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      'Internal Server Error',
    );
  }
};
