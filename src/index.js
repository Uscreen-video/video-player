// export * as types from './types'
// export const components = import.meta.glob('./components/**/*.component.ts', { eager: true })
// export const buttons = import.meta.glob('./components/buttons/*.ts', { eager: true })
import HLS from 'hls.js'


window.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('video')
  const source = video.querySelector('source')
  const controlButton = document.getElementById('control')
  
  const track = video.querySelector('track')

  track.track.mode = 'showing'

  track.addEventListener('cuechange', (data) => {
    console.log('CUE CHANGE', data)
  })

  video.textTracks.addEventListener('addtrack', (data) => {
    console.log('TRACK ADDED', data.track.label)
  })

  controlButton.addEventListener('click', () => {
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  })

  const hls = new HLS({
    maxMaxBufferLength: 30,
    enableWorker: true,
    initialLiveManifestSize: 2,
    liveSyncDurationCount: 5,
    fragLoadingMaxRetry: 10,
    manifestLoadingMaxRetry: 2,
    levelLoadingMaxRetry: 4,
  })

  hls.on(HLS.Events.LEVEL_LOADED, () => {
    console.log('LEVEL LOADED')
    track.track.mode = 'showing'
    hls.subtitleTrack = -1
    hls.subtitleDisplay = false
  })

  hls.on(HLS.Events.MEDIA_ATTACHED, () => {
    hls.loadSource(source.src)
  })

  hls.attachMedia(video)
})