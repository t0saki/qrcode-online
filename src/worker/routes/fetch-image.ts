import { CORS, HttpError } from "../http/responses";
import { assertSafeUrl } from "../http/ssrf";

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "image/avif",
]);

/**
 * GET /api/fetch-image?url= — a thin, SSRF-guarded proxy that lets the client
 * decode a remote image past CORS. Returns the raw image bytes with permissive
 * CORS; decoding itself still happens in the browser.
 */
export async function handleFetchImage(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "GET") {
    throw new HttpError(405, "method_not_allowed", "Use GET.");
  }

  const target = new URL(request.url).searchParams.get("url");
  if (!target) {
    throw new HttpError(400, "missing_url", "The `url` parameter is required.");
  }

  let current = assertSafeUrl(target);
  let upstream = await safeFetch(current);

  let redirects = 0;
  while (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location");
    if (!location || redirects >= MAX_REDIRECTS) break;
    current = assertSafeUrl(new URL(location, current).toString());
    upstream = await safeFetch(current);
    redirects++;
  }

  if (!upstream.ok) {
    throw new HttpError(502, "upstream_error", `The image host returned ${upstream.status}.`);
  }

  const contentType = (upstream.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new HttpError(415, "not_image", "That link doesn't point to a supported image.");
  }

  const declared = upstream.headers.get("content-length");
  if (declared && Number(declared) > MAX_BYTES) {
    throw new HttpError(413, "too_large", "Image exceeds the 5 MB limit.");
  }

  const bytes = await readCapped(upstream, MAX_BYTES);
  if (!bytes) {
    throw new HttpError(413, "too_large", "Image exceeds the 5 MB limit.");
  }

  return new Response(bytes, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600",
      "cross-origin-resource-policy": "cross-origin",
      ...CORS,
    },
  });
}

async function safeFetch(url: URL): Promise<Response> {
  try {
    return await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        accept: "image/*",
        "user-agent": "qrcode-online/1.0 (+https://github.com/t0saki/qrcode-online)",
      },
      cf: { cacheTtl: 3600, cacheEverything: false },
    });
  } catch {
    throw new HttpError(502, "fetch_failed", "Could not reach the image URL.");
  }
}

async function readCapped(response: Response, max: number): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}
