/* eslint-env node */
/**
 * @file Re-exports the vanilla-extract jest transform, so that jest can properly transform .css.ts files.
 * `@vanilla-extract/jest-transform` incorrectly maps its default export, so that `import *` does not work; and expects
 * the wrong shape for options, so it must be re-exported to be correctly used as a jest transform.
 */

const { default: transform } = require('@vanilla-extract/jest-transform')
module.exports = {
  process: (source, filePath, options) =>
    transform.process(source, filePath, { config: options, supportsStaticESM: false }),
}
