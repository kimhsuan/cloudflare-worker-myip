import { config, listApi } from './config';
import getHome from './routes/home';
import getAllJson from './routes/all_json';
import { buildPreflightResponse } from './cors';
import {
  errorResponse,
  successResponse,
  noContentResponse,
} from './utils/responses';
import { ErrorCodes } from './errors';

export async function handleRequest(request: Request): Promise<Response> {
  const requestURL = new URL(request.url);
  const requestPath = requestURL.pathname;

  //* Check target URL validity
  if (config.methods && !config.methods.includes(request.method)) {
    return errorResponse(
      405,
      ErrorCodes.METHOD_NOT_ALLOWED,
      'Method not allowed',
    );
  }

  /*
   * Handle Worker's URL Path
   * If you want to manage various URL path for your worker
   */
  switch (requestPath) {
    // TODO: Manage request path here, add additional condition for mobile if necessary.
    case listApi.health:
      return successResponse({ msg: 'Server up and running' }, { status: 200 });
    case listApi.home:
      return getHome(request);
    case listApi.all_json:
      return getAllJson(request);
    case listApi.cf_json:
      return successResponse(request.cf ?? {}, { status: 200 });
    case listApi.headers: {
      const headersObj = Object.fromEntries(
        request.headers as Iterable<[string, string]>,
      );
      return successResponse(headersObj, { status: 200 });
    }
    default:
      return errorResponse(
        404,
        ErrorCodes.NOT_FOUND,
        'Request path not defined',
      );
  }
}

export async function handleOptions(request: Request): Promise<Response> {
  /*
   * Handle CORS pre-flight request.
   * If you want to check the requested method + headers you can do that here.
   */
  if (
    request.headers.get('Origin') !== null
    && request.headers.get('Access-Control-Request-Method') !== null
    && request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return buildPreflightResponse(request);

    /*
     * Handle standard OPTIONS request.
     * If you want to allow other HTTP Methods, you can do that here.
     */
  }
  return noContentResponse({
    headers: {
      Allow: config.methods.join(', '),
    },
  });
}
