// babel.config.js
module.exports = {
  presets: ['next/babel'],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};