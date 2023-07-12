import { html } from "lit"
import '../video-player'
import '../video-controls'
import '../video-timeline'
import '../video-timer'
import '../video-live-sign'
import '../video-volume-control'
import '../video-cues'
import '../buttons/Play'
import '../buttons/Forward'
import '../buttons/Backward'
import '../buttons/Volume'
import '../buttons/Fullscreen'
import '../buttons/Subtitles'
import '../buttons/Settings'
import '../buttons/Airplay'
import '../buttons/ChromeCast'

export default {
  title: 'components/Player',
  component: 'video-player',
}

export const Default = {
  render: () => html`
    <video-player>
      <video
        playsinline
        slot="video"
        title="My test video"
        poster="https://alpha.uscreencdn.com/video_thumbnails/ekgb_ldxJUzLAg.jpg"
      >
        <source 
          src="https://stream.mux.com/miQlLYOpwPpHbR6KGQTSgn8ZDm4u4G1X.m3u8"
          type="application/x-mpegURL"
        />
      </video>
      <video-controls>
        <video-timeline>
          <video-live-sign></video-live-sign>
          <video-timer></video-timer>
        </video-timeline>
        <video-play-button></video-play-button>
        <video-forward-button></video-forward-button>
        <video-backward-button></video-backward-button>
        <video-volume-button></video-volume-button>
        <video-volume-control></video-volume-control>
        <hr />
        <video-subtitles-button></video-subtitles-button>
        <video-settings-button></video-settings-button>
        <video-airplay-button></video-airplay-button>
        <video-chromecast-button></video-chromecast-button>
        <video-fullscreen-button></video-fullscreen-button>
      </video-controls>
      <video-cues />
    </video-player>
  `
}
