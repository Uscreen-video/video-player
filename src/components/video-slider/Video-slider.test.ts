import { html, fixture, expect } from '@open-wc/testing'
import type { VideoSlider } from './Video-slider.component'
import './Video-slider.component'

describe('<ds-video-slider>', () => {
  it('with default parameters', async () => {
    const el: VideoSlider = await fixture(html`<ds-video-slider></ds-video-slider>`)
    expect(el.disabled).equal(undefined)
  })
})
