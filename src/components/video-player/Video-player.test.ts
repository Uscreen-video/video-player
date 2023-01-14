import { html, fixture, expect } from '@open-wc/testing'
import type { VideoPlayer } from './Video-player.component'
import './Video-player.component'

describe('<ds-video-player>', () => {
  it('with default parameters', async () => {
    const el: VideoPlayer = await fixture(html`<ds-video-player></ds-video-player>`)
    expect(el.disabled).equal(undefined)
  })
})
