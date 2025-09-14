## Purpose

Fast, concrete guidance for AI coding agents working on this Cloudflare Workers TypeScript project. Focus on repo-specific architecture, patterns, and commands to be productive immediately.

## Big picture

- Entry point: `src/worker.ts` validates HTTP methods (from `config.methods`), handles CORS preflight via `handleOptions`, delegates others to `handleRequest`, and wraps all responses with `applyCors`.
- Routing: `src/handler.ts` switches on `new URL(request.url).pathname` and compares against exact strings from `list_api` in `src/config.ts`.
- CORS: `src/cors.ts` centralizes decisions. `config.host` supports `'*'`, `':origin'`, a single origin, or an allowlist array. Preflights use `buildPreflightResponse` (validates requested method/headers and sets `Vary: Origin`, `Max-Age`).
- Responses: `src/utils/responses.ts` provides `JSON_HEADERS`, `successResponse(data)`, `errorResponse(status, code, msg)`, and `noContentResponse()`.
- Errors & types: `src/errors.ts` centralizes `ErrorCodes`. `src/interfaces/ipinfo.ts` defines the `IPInfo` shape.

## Current routes (exact matches)

- `list_api` in `src/config.ts`: `/` (home), `/all.json`, `/cf.json`, `/headers`, `/health`.
- `src/routes/home.ts`: returns the client IP from `CF-Connecting-IP` as plain text (sanitized, no cache).
- `src/routes/all_json.ts`: JSON with IP + Cloudflare `request.cf` metadata. Returns 500 with `ENV_PLATFORM_METADATA_MISSING` if `request.cf` is absent; supports `HEAD` early-exit.

## Conventions and gotchas

- Exact-path routing only; no patterns. Always add new paths to `list_api` and wire a `case` in `handleRequest`.
- CORS is added to all non-preflight responses by `applyCors`; preflights are fully handled by `buildPreflightResponse`.
- `config.host='*'` cannot be combined with `allowCredentials=true` (browser restriction). Use a concrete origin or `':origin'` instead.
- Outside Cloudflare, `request.cf` may be undefined; handlers must check when they depend on it.
- JSON success responses return the raw payload (no `{success: true}` wrapper). Errors use `{ code, message }` with immutable `JSON_HEADERS`.

## Developer workflow

- Dev server: `npm run start` (wrangler dev on http://localhost:8787/ using env `dev`).
- Type-check: `npm run compile` (tsc with `noEmit: true`).
- Lint/format: `npm run lint` / `npm run fix` (gts).
- Deploy: `npm run deploy-dev` (wrangler `--env dev`). For prod, publish with `--env prod` as configured in `wrangler.toml` (route `myip.lai.kim`).
- Node >= 20 required (see `package.json`). Wrangler ~4.33 is used; types via `@cloudflare/workers-types`.

## Add a new route

1) Edit `src/config.ts`: add a new key in `list_api`, e.g. `myroute: '/myroute'`.
2) Create `src/routes/myroute.ts` exporting `getMyroute(request: Request): Response|Promise<Response>`.
3) Edit `src/handler.ts`: import the handler and add a `case list_api.myroute:` branch that returns it.
4) If returning JSON, use `successResponse(data)` and for failures `errorResponse(status, ErrorCodes.X, 'msg')`. If the route needs non-simple headers (e.g., `Authorization`), update `config.allowHeaders` accordingly.

## Files to know

- `src/worker.ts` (fetch handler + CORS wrapping)
- `src/handler.ts` (routing + OPTIONS handling)
- `src/config.ts` (CORS config, allowed methods, `list_api`)
- `src/cors.ts` (CORS logic, preflight builder)
- `src/routes/*` (feature routes: `home.ts`, `all_json.ts`)
- `src/utils/responses.ts` (JSON helpers)
- `wrangler.toml` (envs: `dev`, `prod`; `main = src/worker.ts`)

Questions or missing details? Point to the section and I’ll refine with examples or deeper guidance.
