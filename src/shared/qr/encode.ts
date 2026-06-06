import { Byte, Encoder } from "@nuintun/qrcode";
import type { QrMatrix } from "./matrix";
import type { EccLevel } from "./types";

/** Thrown when the data is too large to encode at the chosen ECC level. */
export class QrCapacityError extends Error {
  constructor(message = "Data is too large for a QR code at this error-correction level.") {
    super(message);
    this.name = "QrCapacityError";
  }
}

/**
 * Encode text into a QR module matrix. Pure, DOM-free — runs identically in the
 * Worker and the browser so server PNGs and the client preview always match.
 */
export function encodeMatrix(data: string, ecc: EccLevel): QrMatrix {
  let encoded;
  try {
    encoded = new Encoder({ level: ecc }).encode(new Byte(data));
  } catch (err) {
    throw new QrCapacityError(err instanceof Error ? err.message : undefined);
  }
  const size = encoded.size;
  return {
    size,
    get: (x, y) => encoded.get(x, y) === 1,
  };
}
