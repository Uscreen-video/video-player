import { html } from 'lit'
import type { VideoTimer } from './Video-timer.component'
import './Video-timer.component'

export default {
  title: 'components/Timer',
  component: 'video-timer',
}

const Template = ({ slot }: VideoTimer) => html`
<ds-video-timer>
  ${slot}
</ds-video-timer>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a video-timer'
}
