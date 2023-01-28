import { html } from 'lit'
import type { VideoControls } from './Video-controls.component'
import './Video-controls.component'

export default {
  title: 'components/Video Controls',
  component: 'ds-video-controls',
}

const Template = ({ slot }: VideoControls) => html`
<ds-video-controls>
  ${slot}
</ds-video-controls>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a video-controls'
}
