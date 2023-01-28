import { html, fixture, expect } from '@open-wc/testing'
import type { VideoControls } from './Video-controls.component'
import './Video-controls.component'

describe('<ds-video-controls>', () => {
  it('with default parameters', async () => {
    const el: VideoControls = await fixture(html`<ds-video-controls></ds-video-controls>`)
    expect(el.disabled).equal(undefined)
  })
})
