/* eslint-env node */

/**
 * TODO(XXXX)
 * Since SWC (Next.js' default compiler) doesn't support macros, we need to use Babel.
 * Even though this file lives in the root folder, it's only used by Next.js. For Create React App,
 * we use `craco.config.cjs`.
 */
module.exports = {
  presets: ['next/babel'],
  plugins: ['@vanilla-extract/babel-plugin', 'macros'],
}
