// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */

const preset = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...preset,
  preset: 'jest-expo',
  haste: {
    defaultPlatform: 'ios',
    // avoid native because wallet tests assume no .native.ts
    platforms: ['web', 'ios', 'android'],
  },
  clearMocks: true,
  globals: {
    ...preset.globals,
  },
}
