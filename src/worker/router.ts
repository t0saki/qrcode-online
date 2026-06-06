import type { Env } from "./env";
import { CORS, HttpError, jsonError } from "./http/responses";
import { handleFetchImage } from "./routes/fetch-image";
import { handleQrImage } from "./routes/qr-image";

/** Route `/api/*` requests. (The Worker only runs for these paths.) */
export async function route(request: Request, _env: Env, ctx: ExecutionContext): Promise<Response> {
  const { pathname } = new URL(request.url);

  try {
    if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: CORS });
    }

    switch (pathname) {
      case "/api/ping":
        return Response.json({ ok: true, service: "qrcode-online" }, { headers: CORS });
      case "/api/qr.svg":
        return await requireGet(request, () => handleQrImage(request, ctx, "svg"));
      case "/api/qr.png":
        return await requireGet(request, () => handleQrImage(request, ctx, "png"));
      case "/api/fetch-image":
        return await handleFetchImage(request);
      default:
        return jsonError(404, "not_found", "Unknown API route.");
    }
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.code, err.message);
    return jsonError(500, "internal_error", "Something went wrong.");
  }
}

function requireGet(request: Request, handler: () => Promise<Response>): Promise<Response> {
  if (request.method !== "GET") {
    return Promise.resolve(jsonError(405, "method_not_allowed", "Use GET."));
  }
  return handler();
}
