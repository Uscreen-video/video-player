import { VideoContainer } from "../Video-container.component";
import debounce from "../../../helpers/debounce"
import { dispatch, Types } from "../../../state"
import type { AudiosController, AudioTrack, VideoElementWithAudioTracks } from "./types"
import _debug from "debug";

const audiosDebug = _debug("player:audios");

const buildNativeAudioTrackId = (track: AudioTrack) => `${track.label}-${track.language}`

export const nativeController = (host: VideoContainer, video: VideoElementWithAudioTracks, activeAudioTrackId?: string): AudiosController => {
  const enableAudioTrack = (id: string) => {
    const newActiveTrack = Array.from(video.audioTracks).find(t => buildNativeAudioTrackId(t) === id)

    if (newActiveTrack) {
      for (let i = 0; i < video.audioTracks.length; i++) {
        video.audioTracks[i].enabled = buildNativeAudioTrackId(video.audioTracks[i]) === id
      }
      audiosDebug('AUDIO TRACK ENABLED', id)
    }

  }
  
  const onTrackAdded = debounce(() => {
    const audioTracks = Array.from(video.audioTracks)

    dispatch(host, Types.Action.update, {
      audioTracks: audioTracks.map((track) => ({
        label: track.label,
        lang: track.language,
        id: buildNativeAudioTrackId(track)
      })),
      activeAudioTrackId: buildNativeAudioTrackId(audioTracks.find(t => t.enabled) || audioTracks[0])
    })

    audioTracks.forEach(t => {
      audiosDebug('AUDIO TRACK ADDED', t.label, t.language, t.enabled)
    })

    if (activeAudioTrackId) {
      enableAudioTrack(activeAudioTrackId)
    }
  }, 100)

  const onTracksChanged = debounce(() => {
    const audioTracks = Array.from(video.audioTracks)
    dispatch(host, Types.Action.update, {
      activeAudioTrackId: buildNativeAudioTrackId(audioTracks.find(t => t.enabled) || audioTracks[0])
    })
  }, 100)

  video.audioTracks.addEventListener('addtrack', onTrackAdded)
  video.audioTracks.addEventListener('change', onTracksChanged)

  return {
    enableAudioTrack
  }
}
