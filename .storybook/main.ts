module.exports = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-mdx-gfm"
  ],
  "framework": {
    "name": "@storybook/web-components-vite",
  },
  "docs": {
    autodocs: true,
  }
}
