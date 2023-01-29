import { html } from 'lit'
import type { VideoTimeline } from './Video-timeline.component'
import './Video-timeline.component'

export default {
  title: 'components/Video Timeline',
  component: 'ds-video-timeline',
}

const Template = ({ slot }: VideoTimeline) => html`
<ds-video-timeline>
  ${slot}
</ds-video-timeline>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a video-timeline'
}
