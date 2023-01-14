---
to: src/components/<%= name %>/<%= h.capitalize(name) %>.test.ts
---
import { html, fixture, expect } from '@open-wc/testing'
import type { <%= h.changeCase.pascal(name) %> } from './<%= h.capitalize(name) %>.component'
import './<%= h.capitalize(name) %>.component'

describe('<ds-<%= name %>>', () => {
  it('with default parameters', async () => {
    const el: <%= h.changeCase.pascal(name) %> = await fixture(html`<ds-<%= name %>></ds-<%= name %>>`)
    expect(el.disabled).equal(undefined)
  })
})
