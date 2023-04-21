/***
 * @vanilla-extract/jest-transform incorrectly maps its default export to "default", and so must be transformed itself
 * to be usable by jest.
 */

const { default: transform } = require('@vanilla-extract/jest-transform')
module.exports = {
  process: (source, filePath, options) => transform.process(source, filePath, { config: options, supportsStaticESM: false })
}
