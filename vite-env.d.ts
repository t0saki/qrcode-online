/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Self-hosted WASM asset imports (resolved by Vite's `?url` suffix).
declare module "*.wasm?url" {
  const src: string;
  export default src;
}

// HTMLVideoElement.requestVideoFrameCallback is not yet in the default DOM lib.
interface VideoFrameCallbackMetadata {
  presentationTime: DOMHighResTimeStamp;
  expectedDisplayTime: DOMHighResTimeStamp;
  width: number;
  height: number;
  mediaTime: number;
  presentedFrames: number;
  processingDuration?: number;
}
interface HTMLVideoElement {
  requestVideoFrameCallback(
    callback: (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => void,
  ): number;
  cancelVideoFrameCallback(handle: number): void;
}

// MediaTrackCapabilities/Constraints torch flag (not in default lib).
interface MediaTrackCapabilities {
  torch?: boolean;
}
interface MediaTrackConstraintSet {
  torch?: boolean;
}
