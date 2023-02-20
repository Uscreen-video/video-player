---
to: src/components/<%= name %>/<%= h.capitalize(name) %>.stories.ts
---
export default {
  title: 'components/<%= h.changeCase.title(name) %>',
  component: '<%= name %>',
}

export const Default = {}
