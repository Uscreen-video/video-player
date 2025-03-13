import { VideoContainer } from "../Video-container.component";
import type Hls from "hls.js";
import type { MediaPlaylist } from "hls.js";
import { dispatch, Types } from "../../../state";
import type { AudiosController } from "./types";
import _debug from "debug";

const audiosDebug = _debug("player:audios");

const buildHlsAudioTrackId = (track: MediaPlaylist) => `${track.name}-${track.lang}`

export const hlsController = (host: VideoContainer, hls: Hls, activeAudioTrackId?: string): AudiosController => {
  const enableAudioTrack = (id: string) => {
    const newHlsTrackId = hls.audioTracks.find(t => buildHlsAudioTrackId(t) === id)?.id
    if (typeof newHlsTrackId === 'number') {
      hls.audioTrack = newHlsTrackId
      dispatch(host, Types.Action.update, {
        activeAudioTrackId: id
      })
      audiosDebug('AUDIO TRACK ENABLED', id)
    }
  }

  if (hls.audioTracks.length > 0) {
    dispatch(host, Types.Action.update, {
      audioTracks: hls.audioTracks.map((track) => ({
        label: track.name,
        lang: track.lang,
        id: buildHlsAudioTrackId(track)
      })),
      activeAudioTrackId: buildHlsAudioTrackId(hls.audioTracks.find(t => t.id === hls.audioTrack) || hls.audioTracks[0])
    })

    hls.audioTracks.forEach(t => {
      audiosDebug('AUDIO TRACK ADDED', t.id, t.name, t.lang)
    })

    if (activeAudioTrackId) {
      enableAudioTrack(activeAudioTrackId)
    }
  }

  return {
    enableAudioTrack
  }
}
