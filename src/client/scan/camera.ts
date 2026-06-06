import { getDetector, type DetectHit } from "./detector";

export type CameraError = "denied" | "none" | "insecure" | "error";

export interface CameraHandle {
  video: HTMLVideoElement;
  start(): Promise<boolean>;
  stop(): void;
  toggleTorch(): Promise<void>;
  switchCamera(): Promise<void>;
  capabilities(): { torch: boolean; multiple: boolean };
}

const SCAN_INTERVAL_MS = 130;

export function createCamera(opts: {
  onResult: (hit: DetectHit) => void;
  onError: (kind: CameraError) => void;
}): CameraHandle {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");

  let stream: MediaStream | null = null;
  let running = false;
  let busy = false;
  let lastScan = 0;
  let rafId = 0;
  let rvfcId = 0;
  let torchOn = false;
  let torchCapable = false;
  let facing: "environment" | "user" = "environment";
  let videoInputs: MediaDeviceInfo[] = [];

  async function start(): Promise<boolean> {
    stop();
    if (!navigator.mediaDevices?.getUserMedia) {
      opts.onError(window.isSecureContext ? "error" : "insecure");
      return false;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
    } catch (err) {
      const name = (err as DOMException)?.name;
      opts.onError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "denied"
          : name === "NotFoundError" || name === "OverconstrainedError"
            ? "none"
            : "error",
      );
      return false;
    }

    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      /* autoplay can reject silently; the frame loop still runs */
    }

    const track = stream.getVideoTracks()[0];
    const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities;
    torchCapable = caps.torch === true;
    torchOn = false;
    try {
      videoInputs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
    } catch {
      videoInputs = [];
    }

    running = true;
    schedule();
    return true;
  }

  function schedule(): void {
    if (!running) return;
    if ("requestVideoFrameCallback" in video) {
      rvfcId = video.requestVideoFrameCallback(() => void tick());
    } else {
      rafId = requestAnimationFrame(() => void tick());
    }
  }

  async function tick(): Promise<void> {
    if (!running) return;
    const now = performance.now();
    if (!busy && now - lastScan >= SCAN_INTERVAL_MS && video.readyState >= 2) {
      busy = true;
      lastScan = now;
      try {
        const detector = await getDetector();
        const hits = await detector.detect(video);
        if (hits.length && running) {
          running = false;
          opts.onResult(hits[0]!);
          stop();
          return;
        }
      } catch {
        /* transient decode error — keep scanning */
      } finally {
        busy = false;
      }
    }
    schedule();
  }

  function stop(): void {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (rvfcId && "cancelVideoFrameCallback" in video) {
      video.cancelVideoFrameCallback(rvfcId);
      rvfcId = 0;
    }
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      stream = null;
    }
    // Keep the last frame visible (freezes the viewfinder on a successful scan).
  }

  async function toggleTorch(): Promise<void> {
    const track = stream?.getVideoTracks()[0];
    if (!track || !torchCapable) return;
    torchOn = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: torchOn }] });
    } catch {
      torchOn = !torchOn;
    }
  }

  async function switchCamera(): Promise<void> {
    facing = facing === "environment" ? "user" : "environment";
    await start();
  }

  function capabilities() {
    return { torch: torchCapable, multiple: videoInputs.length > 1 };
  }

  return { video, start, stop, toggleTorch, switchCamera, capabilities };
}
