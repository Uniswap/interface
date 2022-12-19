/* eslint-env node */

/**
 * This is a workaround to allow ESLint to resolve plugins that were installed
 * by an external config: https://github.com/eslint/eslint/issues/3458
 */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  extends: '@uniswap/eslint-config/react',
}
