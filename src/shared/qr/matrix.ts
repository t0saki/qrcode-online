/** A square grid of QR modules. `get(x, y)` is true for dark modules. */
export interface QrMatrix {
  readonly size: number;
  get(x: number, y: number): boolean;
}

/** Parse a 6-digit hex color (no `#`) into an `[r, g, b]` byte tuple. */
export function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex, 16) | 0;
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

/** Turn a stored color (`"rrggbb"` or `"transparent"`) into a CSS color. */
export function cssColor(color: string): string {
  return color === "transparent" ? "transparent" : `#${color}`;
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}
