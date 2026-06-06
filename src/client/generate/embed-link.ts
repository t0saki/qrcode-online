import { buildImgTag, buildQrUrl } from "../../shared/url/qr-url";
import type { QrSpec } from "../../shared/qr/types";
import type { GenState } from "./gen-store";

export function toSpec(state: GenState): QrSpec {
  return {
    data: state.data,
    ecc: state.ecc,
    size: state.size,
    margin: state.margin,
    dark: state.dark,
    light: state.light,
  };
}

export function embedUrl(state: GenState): string {
  return buildQrUrl(location.origin, toSpec(state), "png");
}

export function embedImgTag(state: GenState): string {
  return buildImgTag(embedUrl(state), state.size);
}
