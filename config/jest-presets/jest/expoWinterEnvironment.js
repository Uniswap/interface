const JsdomEnvironment = require('jest-environment-jsdom').default
const { ReadableStream, WritableStream, TransformStream, TextEncoderStream, TextDecoderStream } = require('node:stream/web')
const { TextEncoder, TextDecoder } = require('node:util')

// jest-environment-jsdom omits the Web Streams + encoding globals that expo's winter
// native runtime installs at import time; provide them so the runtime loads under jsdom.
class ExpoWinterEnvironment extends JsdomEnvironment {
  constructor(config, context) {
    super(config, context)
    const g = this.global
    g.ReadableStream ??= ReadableStream
    g.WritableStream ??= WritableStream
    g.TransformStream ??= TransformStream
    g.TextEncoderStream ??= TextEncoderStream
    g.TextDecoderStream ??= TextDecoderStream
    g.TextEncoder ??= TextEncoder
    g.TextDecoder ??= TextDecoder
  }
}

module.exports = ExpoWinterEnvironment
