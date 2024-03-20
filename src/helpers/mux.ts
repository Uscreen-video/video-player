import { MuxOptions, MuxParams } from "../types";

export const connectMuxData = async (
  element: HTMLElement,
  data: MuxParams,
  options?: MuxOptions,
) => {
  const mux = await import("mux-embed");
  mux.monitor(element, {
    ...options,
    data: {
      ...data,
      player_version: options?.Hls ? "HLS" : "Native",
    },
  });
};
