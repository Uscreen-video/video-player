---
to: src/components/<%= name %>/<%= h.capitalize(name) %>.component.ts
---
import { unsafeCSS, LitElement, html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './<%= h.capitalize(name) %>.styles.css?inline'

/**
 * @slot - <%= h.capitalize(name) %> main content
 * */
@customElement('<%= name %>')
export class <%= h.changeCase.pascal(name) %> extends LitElement {
  static styles = unsafeCSS(styles)

  render() {
    return html`
      <slot>i am a <%= name %></slot>
    `
  }
}
