import type { Env } from "./env";

/**
 * The Worker only runs for `/api/*` routes (see `run_worker_first` in
 * wrangler.jsonc). Every other request is served directly from static assets,
 * with SPA fallback to `index.html`.
 */
export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/ping") {
      return Response.json({ ok: true, service: "qrcode-online" });
    }

    return Response.json({ error: "not_found", message: "Unknown API route." }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
