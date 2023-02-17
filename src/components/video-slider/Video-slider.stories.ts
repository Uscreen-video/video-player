import { html } from 'lit'
import type { VideoSlider } from './Video-slider.component'
import './Video-slider.component'

export default {
  title: 'components/Slider',
  component: 'video-slider',
}

const Template = ({ slot }: VideoSlider) => html`
<ds-video-slider>
  ${slot}
</ds-video-slider>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a video-slider'
}
