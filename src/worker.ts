/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { config } from './config';
import { handleRequest, handleOptions } from './handler';
import { applyCors } from './cors';

export default {
  async fetch(request: Request): Promise<Response> {
    const isMethodAllowed = config.methods.includes(request.method);

    if (!isMethodAllowed) {
      return applyCors(
        request,
        new Response(null, {
          status: 405,
          statusText: 'Method Not Allowed',
        }),
      );
    }

    if (request.method === 'OPTIONS') {
      return handleOptions(request); // already includes CORS via buildPreflightResponse
    }
    const resp = await handleRequest(request);
    return applyCors(request, resp);
  },
};
