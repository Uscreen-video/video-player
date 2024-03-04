import { readFileSync } from 'node:fs'
import nesting from 'postcss-nesting'
import simpleVars from 'postcss-simple-vars'
import env from 'postcss-preset-env'

const getVariables = () => {
  const file = './src/variables.json';
  const config = JSON.parse(readFileSync(new URL(file, import.meta.url)))
  return Object.keys(config).reduce((acc, key) => {
    acc[key] = `var(--video-player-${key}, ${config[key]})`
    return acc
  }, {})
}

export default {
  plugins: [
    nesting,
    simpleVars({
      variables: () => getVariables(),
    }),
    env(),
  ],
}
