import { State } from "../types";

export type StorageValue = Partial<
  Pick<
    State,
    | "isMuted"
    | "volume"
    | "activeQualityLevel"
    | "activeTextTrackId"
    | "playbackRate"
    | "activeAudioTrackId"
  >
>;

export type StorageProvider = {
  get: () => StorageValue;
  set: (val: StorageValue) => void;
  clear: () => void;
};

export const createProvider = (key?: string): StorageProvider => {
  const Provider: StorageProvider = {
    get: () => {
      if (!key) return {};
      try {
        const value = JSON.parse(window.localStorage.getItem(key) ?? "{}");
        return value && typeof value === "object" && !Array.isArray(value)
          ? value
          : {};
      } catch {
        return {};
      }
    },
    set: (val) => {
      if (!key) return;
      try {
        window.localStorage.setItem(key, JSON.stringify(val));
      } catch {}
    },
    clear: () => {
      if (!key) return;
      window.localStorage.removeItem(key);
    },
  };

  return Provider;
};
