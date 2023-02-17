import { html } from 'lit'
import type { VideoPlayButton } from './Video-play-button.component'
import './Video-play-button.component'

export default {
  title: 'components/Play Button',
  component: 'video-play-button',
}

const Template = ({ slot }: VideoPlayButton) => html`
<ds-video-play-button>
  ${slot}
</ds-video-play-button>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a video-play-button'
}
