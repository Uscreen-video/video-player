---
to: src/components/<%= name %>/<%= h.capitalize(name) %>.stories.ts
---
import { html } from 'lit'
import type { <%= h.changeCase.pascal(name) %> } from './<%= h.capitalize(name) %>.component'
import './<%= h.capitalize(name) %>.component'

export default {
  title: 'components/<%= h.changeCase.title(name) %>',
  component: '<%= name %>',
}

export const Default = {}
