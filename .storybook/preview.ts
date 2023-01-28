import { setCustomElementsManifest } from '@storybook/web-components'
import { createArgsExtractor, createLitRenderer } from 'cem-plugin-better-lit-types/storybook'
import customElements from '../custom-elements.json'

setCustomElementsManifest(customElements)

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    extractArgTypes: createArgsExtractor(customElements)
  }
}

export const render = createLitRenderer({
  wrapSlots: true,
  joinArrays: true,
})
