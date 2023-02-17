import { html } from 'lit'
import type { VideoCues } from './Video-cues.component'
import './Video-cues.component'

export default {
  title: 'components/Cues',
  component: 'video-cues',
}

const Template = ({ slot }: VideoCues) => html`
<video-cues>
  ${slot}
</video-cues>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a video-cues'
}
