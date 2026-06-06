import { DEFAULT_SPEC, type QrSpec } from "../qr/types";

/** Build an embeddable `/api/qr.<fmt>` URL, omitting params left at default. */
export function buildQrUrl(origin: string, spec: QrSpec, fmt: "svg" | "png"): string {
  const p = new URLSearchParams();
  p.set("data", spec.data);
  if (spec.ecc !== DEFAULT_SPEC.ecc) p.set("ecc", spec.ecc);
  if (spec.size !== DEFAULT_SPEC.size) p.set("size", String(spec.size));
  if (spec.margin !== DEFAULT_SPEC.margin) p.set("margin", String(spec.margin));
  if (spec.dark !== DEFAULT_SPEC.dark) p.set("dark", spec.dark);
  if (spec.light !== DEFAULT_SPEC.light) p.set("light", spec.light);
  return `${origin}/api/qr.${fmt}?${p.toString()}`;
}

/** Build an `<img>` snippet for the given embeddable URL. */
export function buildImgTag(url: string, size: number): string {
  return `<img src="${url}" width="${size}" height="${size}" alt="QR code" />`;
}
