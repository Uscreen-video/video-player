const path = require('path')

const getVariables = () => {
  const file = './src/variables.json';
  delete require.cache[path.join(__dirname, file)];
  const config = require(file)
  return Object.keys(config).reduce((acc, key) => {
    acc[key] = `var(--video-player-${key}, ${config[key]})`
    return acc
  }, {})
}

module.exports = {
  plugins: [
    require('postcss-nesting'),
    require('postcss-simple-vars')({
      variables: () => getVariables(),
    }),
    require('postcss-preset-env')({
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
    }),
  ],
}
