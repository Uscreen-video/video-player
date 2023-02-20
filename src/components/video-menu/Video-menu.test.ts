import { html, fixture, expect } from '@open-wc/testing'
import type { VideoMenu } from './Video-menu.component'
import './Video-menu.component'

describe('<ds-video-menu>', () => {
  it('with default parameters', async () => {
    const el: VideoMenu = await fixture(html`<ds-video-menu></ds-video-menu>`)
    expect(el.disabled).equal(undefined)
  })
})
