import { HttpError } from "./responses";

/**
 * Validate a user-supplied URL before the Worker fetches it, to mitigate SSRF.
 * Rejects non-http(s) schemes, embedded credentials, and IP literals in
 * private / loopback / link-local / reserved ranges. (Cloudflare's network also
 * blocks Workers from reaching RFC-1918 space; this is defense in depth.)
 */
export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError(400, "bad_url", "Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new HttpError(400, "bad_scheme", "Only http(s) URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new HttpError(400, "bad_url", "URLs with embedded credentials are not allowed.");
  }
  if (isBlockedHost(url.hostname.toLowerCase())) {
    throw new HttpError(403, "blocked_host", "That host is not allowed.");
  }
  return url;
}

function isBlockedHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }

  // IPv6 literal (may be bracketed).
  if (host.includes(":")) {
    const h = host.replace(/^\[/, "").replace(/\]$/, "");
    if (h === "::1" || h === "::") return true; // loopback / unspecified
    if (/^f[cd]/.test(h)) return true; // fc00::/7 unique-local
    if (/^fe[89ab]/.test(h)) return true; // fe80::/10 link-local
    if (/^::ffff:/.test(h)) return true; // IPv4-mapped
    return false;
  }

  // IPv4 literal.
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 10 || a === 127) return true; // this-host / private / loopback
    if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  return false; // a hostname — allowed (residual DNS-rebinding risk noted)
}
