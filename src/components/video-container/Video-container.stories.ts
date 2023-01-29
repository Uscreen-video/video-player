import { html } from 'lit'
import type { VideoContainer } from './Video-container.component'
import './Video-container.component'

export default {
  title: 'components/Video Container',
  component: 'ds-video-container',
}

const Template = ({ slot }: VideoContainer) => html`
<ds-video-container>
  ${slot}
</ds-video-container>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a video-container'
}
