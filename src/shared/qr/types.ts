/**
 * Shared QR types and bounds — the single source of truth used by both the
 * Worker (image API validation) and the client (UI control ranges).
 */

export type EccLevel = "L" | "M" | "Q" | "H";

export const ECC_LEVELS: readonly EccLevel[] = ["L", "M", "Q", "H"];

/** A fully-resolved, normalized QR request. Colors are 6-digit lowercase hex
 *  WITHOUT a leading `#`; `light` may be the literal string `"transparent"`. */
export interface QrSpec {
  data: string;
  ecc: EccLevel;
  size: number;
  margin: number;
  dark: string;
  light: string;
}

/** Options for the matrix renderers (SVG / PNG / canvas). */
export interface RenderOpts {
  margin: number;
  /** 6-hex (no `#`). */
  dark: string;
  /** 6-hex (no `#`) or `"transparent"`. */
  light: string;
  /** Target raster edge in px (PNG/canvas only; ignored by SVG). */
  size?: number;
  /** Center logo overlay — client-only; never used by the public image API. */
  logo?: LogoOpts;
}

export interface LogoOpts {
  /** Data URL or absolute URL of the logo image. */
  href: string;
  /** Fraction of the QR edge the logo box occupies (clamped 0.1–0.3). */
  scale: number;
}

export const BOUNDS = {
  data: { max: 2048 },
  size: { min: 64, max: 1024, default: 256, step: 8 },
  margin: { min: 0, max: 16, default: 4 },
  ecc: { default: "M" as EccLevel },
  colors: { dark: "000000", light: "ffffff" },
} as const;

export const DEFAULT_SPEC: Readonly<Omit<QrSpec, "data">> = {
  ecc: BOUNDS.ecc.default,
  size: BOUNDS.size.default,
  margin: BOUNDS.margin.default,
  dark: BOUNDS.colors.dark,
  light: BOUNDS.colors.light,
};
