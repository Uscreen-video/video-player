import { html, fixture, expect } from '@open-wc/testing'
import type { VideoCondition } from './Video-condition.component'
import './Video-condition.component'

describe('<ds-video-condition>', () => {
  it('with default parameters', async () => {
    const el: VideoCondition = await fixture(html`<ds-video-condition></ds-video-condition>`)
    expect(el.disabled).equal(undefined)
  })
})
