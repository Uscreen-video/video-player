import { html, fixture, expect } from '@open-wc/testing'
import type { VideoPlayButton } from './Video-play-button.component'
import './Video-play-button.component'

describe('<ds-video-play-button>', () => {
  it('with default parameters', async () => {
    const el: VideoPlayButton = await fixture(html`<ds-video-play-button></ds-video-play-button>`)
    expect(el.disabled).equal(undefined)
  })
})
