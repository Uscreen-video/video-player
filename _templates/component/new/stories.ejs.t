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

const Template = ({ slot }: <%= h.changeCase.pascal(name) %>) => html`
<<%= name %>>
  ${slot}
<<%= name %>>
`

export const Default = Template.bind({})
Default.args = {
  slot: 'I am a <%= name %>'
}
