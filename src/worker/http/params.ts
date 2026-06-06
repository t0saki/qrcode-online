import { BOUNDS, ECC_LEVELS, type EccLevel, type QrSpec } from "../../shared/qr/types";
import { HttpError } from "./responses";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Parse, validate, and normalize the `/api/qr.*` query into a QrSpec. */
export function parseQrParams(sp: URLSearchParams): QrSpec {
  const data = sp.get("data");
  if (data == null || data === "") {
    throw new HttpError(400, "missing_data", "The `data` parameter is required.");
  }
  const byteLength = new TextEncoder().encode(data).length;
  if (byteLength > BOUNDS.data.max) {
    throw new HttpError(400, "data_too_long", `\`data\` exceeds ${BOUNDS.data.max} bytes.`);
  }

  const eccRaw = (sp.get("ecc") ?? BOUNDS.ecc.default).toUpperCase();
  if (!ECC_LEVELS.includes(eccRaw as EccLevel)) {
    throw new HttpError(400, "bad_ecc", "`ecc` must be one of L, M, Q, H.");
  }

  return {
    data,
    ecc: eccRaw as EccLevel,
    size: clampInt(sp.get("size"), BOUNDS.size.min, BOUNDS.size.max, BOUNDS.size.default),
    margin: clampInt(sp.get("margin"), BOUNDS.margin.min, BOUNDS.margin.max, BOUNDS.margin.default),
    dark: normColor(sp.get("dark"), BOUNDS.colors.dark, "dark"),
    light: normColor(sp.get("light"), BOUNDS.colors.light, "light"),
  };
}

function clampInt(value: string | null, lo: number, hi: number, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

function normColor(value: string | null, fallback: string, name: "dark" | "light"): string {
  if (value == null || value === "") return fallback;
  const lower = value.toLowerCase();
  if (name === "light" && (lower === "transparent" || lower === "none")) {
    return "transparent";
  }
  if (!HEX.test(value)) {
    throw new HttpError(400, "bad_color", `Invalid \`${name}\` color (use a 3- or 6-digit hex).`);
  }
  let hex = lower.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return hex;
}
