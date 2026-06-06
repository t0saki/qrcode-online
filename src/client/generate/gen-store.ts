import { DEFAULT_SPEC, type EccLevel } from "../../shared/qr/types";
import { createStore, type Store } from "../state";

export interface GenState {
  data: string;
  ecc: EccLevel;
  size: number;
  margin: number;
  dark: string;
  light: string;
  /** Logo as a (downscaled) PNG data URL, or null. */
  logo: string | null;
}

const KEY = "qro.gen.v1";

function defaults(): GenState {
  return {
    data: "https://github.com/t0saki/qrcode-online",
    ...DEFAULT_SPEC,
    logo: null,
  };
}

function load(): GenState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GenState>;
      if (typeof parsed.data === "string") return { ...defaults(), ...parsed };
    }
  } catch {
    /* ignore */
  }
  return defaults();
}

export const genStore: Store<GenState> = createStore<GenState>(load());

genStore.subscribe((state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota — ignore */
  }
});
