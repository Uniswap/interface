// Custom test environment to provide `TextEncoder`/`TextDecoder`

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Environment = require('jest-environment-jsdom')

module.exports = class CustomTestEnvironment extends Environment {
  async setup() {
    await super.setup()
    if (typeof this.global.TextEncoder === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TextEncoder, TextDecoder } = require('util')
      this.global.TextEncoder = TextEncoder
      this.global.TextDecoder = TextDecoder
    }
  }
}
