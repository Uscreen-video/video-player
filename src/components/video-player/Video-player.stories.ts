import { html } from 'lit'
import './Video-player.component'
import '../video-play-button'

export default {
  title: 'Video Player',
  component: 'video-player',
  render: (args) => html`
    <video-player>
      <video
        playsinline
        autoplay
        slot="video"
        poster="https://alpha.uscreencdn.com/video_thumbnails/ekgb_ldxJUzLAg.jpg"
      >
        <source 
          src="https://stream.mux.com/miQlLYOpwPpHbR6KGQTSgn8ZDm4u4G1X.m3u8"
          type="application/x-mpegURL"
        />
      </video>
      <video-play-button>

      </video-play-button>
    </video-player>
  `
  ,
}

export const Default = {
  args: {
    slot: 'hey ho'
  }
}
