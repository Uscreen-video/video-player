import { html, fixture, expect } from '@open-wc/testing'
import type { VideoTimer } from './Video-timer.component'
import './Video-timer.component'

describe('<ds-video-timer>', () => {
  it('with default parameters', async () => {
    const el: VideoTimer = await fixture(html`<ds-video-timer></ds-video-timer>`)
    expect(el.disabled).equal(undefined)
  })
})
