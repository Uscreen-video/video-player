import { html, fixture, expect } from '@open-wc/testing'
import type { VideoProgress } from './Video-progress.component'
import './Video-progress.component'

describe('<ds-video-progress>', () => {
  it('with default parameters', async () => {
    const el: VideoProgress = await fixture(html`<ds-video-progress></ds-video-progress>`)
    expect(el.disabled).equal(undefined)
  })
})
