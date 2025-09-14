export const config = {
  // * CORS origin strategy (unified):
  //   host can be:
  //     '*'                       -> allow any origin (no credentials allowed)
  //     ':origin'                 -> reflect request Origin (use with caution,
  //                                can allow any site; pair with allowCredentials if needed)
  //     'https://example.com'     -> single fixed origin
  //     ['https://a.com','https://b.com'] -> allowlist of exact origins
  host: ['https://example.com', 'https://example.net'], // change as needed
  // Whether to send Access-Control-Allow-Credentials: true
  // NOTE: If this is true you MUST NOT use '*' (the browser will reject).
  // Use a concrete origin or ':origin'.
  allowCredentials: false,
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS', 'PATCH'],
  // CORS header controls
  allowHeaders: ['Content-Type'], // extend with 'Authorization', 'X-Requested-With', etc. as needed
  exposeHeaders: [], // e.g. ['Content-Length'] if you need client access
  maxAge: 86400, // seconds (24h) for preflight cache
};

// * List of APIs provided by the worker
export const listApi: {readonly [key: string]: string} = {
  health: '/health',
  home: '/',
  all_json: '/all.json',
  cf_json: '/cf.json',
  headers: '/headers',
};
