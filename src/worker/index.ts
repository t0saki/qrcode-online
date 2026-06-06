import type { Env } from "./env";
import { route } from "./router";

/**
 * The Worker only runs for `/api/*` routes (see `run_worker_first` in
 * wrangler.jsonc). Every other request is served directly from static assets,
 * with SPA fallback to `index.html`.
 */
export default {
  fetch(request, env, ctx) {
    return route(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
