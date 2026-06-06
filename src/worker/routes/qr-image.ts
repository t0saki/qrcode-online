import { encodeMatrix, QrCapacityError } from "../../shared/qr/encode";
import { renderPng } from "../../shared/qr/render-png";
import { renderSvg } from "../../shared/qr/render-svg";
import type { RenderOpts } from "../../shared/qr/types";
import { etagFor, IMMUTABLE } from "../http/cache";
import { parseQrParams } from "../http/params";
import { CORS, HttpError } from "../http/responses";

/** GET /api/qr.svg | /api/qr.png — the deterministic, cacheable image API. */
export async function handleQrImage(
  request: Request,
  ctx: ExecutionContext,
  fmt: "svg" | "png",
): Promise<Response> {
  const url = new URL(request.url);
  const spec = parseQrParams(url.searchParams); // throws HttpError on bad input

  const etag = await etagFor(spec, fmt);
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { etag, "cache-control": IMMUTABLE, ...CORS },
    });
  }

  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;

  let matrix;
  try {
    matrix = encodeMatrix(spec.data, spec.ecc);
  } catch (err) {
    if (err instanceof QrCapacityError) {
      throw new HttpError(
        400,
        "data_capacity",
        "Too much data for one QR code at this error-correction level — shorten it or lower `ecc`.",
      );
    }
    throw err;
  }

  const opts: RenderOpts = {
    margin: spec.margin,
    dark: spec.dark,
    light: spec.light,
    size: spec.size,
  };

  const body: BodyInit =
    fmt === "svg" ? renderSvg(matrix, opts) : await renderPng(matrix, opts);
  const contentType = fmt === "svg" ? "image/svg+xml; charset=utf-8" : "image/png";

  const response = new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": IMMUTABLE,
      etag,
      vary: "Accept-Encoding",
      "cross-origin-resource-policy": "cross-origin",
      ...CORS,
    },
  });

  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}
