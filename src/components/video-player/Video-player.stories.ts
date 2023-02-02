import { html } from 'lit'
import './Video-player.component'
import '../video-play-button'
import '../video-timeline'
import '../video-volume-control'

import enCaptions from '../../../mocks/captions_en.vtt?url'

export default {
  title: 'Video Player',
  component: 'video-player',
  render: (args) => html`
    <video-player>
      <video
        slot="video"
        poster="https://alpha.uscreencdn.com/video_thumbnails/ekgb_ldxJUzLAg.jpg"
      >
        <source 
          src="https://stream.mux.com/miQlLYOpwPpHbR6KGQTSgn8ZDm4u4G1X.m3u8"
          type="application/x-mpegURL"
        />
        <track
          default
          label="English"
          kind="subtitles" 
          srclang="en" 
          id="sub_1"
          src="${enCaptions}"
        />
      </video>
      <div slot="controls" style="width: 100%;">
        <video-play-button></video-play-button>
        <video-volume-control></video-volume-control>
        <video-timeline timer></video-timeline>
      </div>
    </video-player>
  `
  ,
}

export const Default = {
  args: {
    slot: 'hey ho'
  }
}
