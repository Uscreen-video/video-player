import { nativeController } from "./native";
import { hlsController } from "./hls";
import type { AudiosController, VideoElementWithAudioTracks } from "./types";
import type { VideoContainer } from "../Video-container.component";
import type Hls from "hls.js";

export const audiosController = (host: VideoContainer, video: HTMLVideoElement, hls?: Hls, activeAudioTrackId?: string): AudiosController => {
  if (hls) {
    return hlsController(host, hls, activeAudioTrackId)
  } else {
    return nativeController(host, video as VideoElementWithAudioTracks, activeAudioTrackId)
  }
}
