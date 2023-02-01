import { html } from 'lit'
import type { VideoVolumeControl } from './Video-volume-control.component'
import './Video-volume-control.component'

export default {
  title: 'components/Video Volume Control',
  component: 'video-volume-control',
}

const Template = ({ slot }: VideoVolumeControl) => html`
<video-volume-control>
  ${slot}
<video-volume-control>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a video-volume-control'
}
