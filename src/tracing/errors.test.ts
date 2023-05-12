import { ErrorEvent, Event } from '@sentry/types'

import { beforeSend, filterKnownErrors } from './errors'

Object.defineProperty(window.performance, 'getEntriesByType', {
  writable: true,
  value: jest.fn(),
})

describe('beforeSend', () => {
  const ERROR = {} as ErrorEvent

  describe('chunkResponseStatus', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('handles when matching JS file not found', () => {
      jest.spyOn(window.performance, 'getEntriesByType').mockReturnValue([])
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect((beforeSend(ERROR, { originalException }) as Event).tags).toBeUndefined()
    })

    it('handles when matching CSS file not found', () => {
      jest.spyOn(window.performance, 'getEntriesByType').mockReturnValue([])
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect((beforeSend(ERROR, { originalException }) as Event).tags).toBeUndefined()
    })

    it('handles when performance is undefined', () => {
      window.performance = undefined as any
      const originalException = new Error('Loading CSS chunk 12 failed. (./static/css/12.d5b3cfe3.chunk.css)')
      expect((beforeSend(ERROR, { originalException }) as Event).tags).toBeUndefined()
    })

    it('adds status for a matching JS file', () => {
      jest.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
        {
          name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
          responseStatus: 499,
        } as PerformanceEntry,
      ])
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect((beforeSend(ERROR, { originalException }) as Event).tags?.chunkResponseStatus).toBe(499)
    })

    it('adds status for a matching CSS file', () => {
      jest.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
        {
          name: 'https://app.uniswap.org/static/css/12.d5b3cfe3.chunk.css',
          responseStatus: 200,
        } as PerformanceEntry,
      ])
      const originalException = new Error('Loading CSS chunk 12 failed. (./static/css/12.d5b3cfe3.chunk.css)')
      expect((beforeSend(ERROR, { originalException }) as Event).tags?.chunkResponseStatus).toBe(200)
    })
  })
})

describe('filterKnownErrors', () => {
  const ERROR = {} as ErrorEvent
  it('propagates an error', () => {
    expect(filterKnownErrors(ERROR, {})).toBe(ERROR)
  })

  it('propagates an error with generic text', () => {
    const originalException = new Error('generic error copy')
    expect(filterKnownErrors(ERROR, { originalException })).toBe(ERROR)
  })

  it('propagates user rejected request errors', () => {
    const originalException = new Error('user rejected transaction')
    expect(filterKnownErrors(ERROR, { originalException })).toBe(ERROR)
  })

  it('filters block number polling errors', () => {
    const originalException = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber' })
    })()
    expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
  })

  it('filters network change errors', () => {
    const originalException = new Error('underlying network changed')
    expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
  })

  it('filters invalid HTML response errors', () => {
    const originalException = new SyntaxError("Unexpected token '<'")
    expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
  })

  it('filters chrome-extension errors', () => {
    const originalException = new Error()
    originalException.stack = ` 
      TypeError: Cannot create proxy with a non-object as target or handler
        at pa(chrome-extension://kbjhmlgclljgdhmhffjofbobmficicjp/proxy-window-evm.a5430696.js:22:216604)
        at da(chrome-extension://kbjhmlgclljgdhmhffjofbobmficicjp/proxy-window-evm.a5430696.js:22:212968)
        at a(../../../../src/helpers.ts:98:1)
    `
    expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
  })

  describe('OneKey', () => {
    it('filter OneKey errors (macOS users)', () => {
      const originalException = new Error()
      originalException.stack = `
        SyntaxError: Unexpected token u in JSON at position 0
          at JSON.parse(<anonymous>)
          at _d._handleAccountChange(/Applications/OneKey.app/Contents/Resources/static/preload.js:2:1634067)
      `
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })
    it('filter OneKey errors (Windows users)', () => {
      const originalException = new Error()
      originalException.stack = `
        SyntaxError: Unexpected token u in JSON at position 0
          at JSON.parse(<anonymous>)
          vd._handleAccountChange(C:\\Users\\example\\AppData\\Local\\Programs\\OneKey\\resources\\static\\preload.js:2:1626130
      `
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })
  })

  describe('Content Security Policy', () => {
    it('filters unsafe-eval evaluate errors', () => {
      const originalException = new Error(
        "Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: \"script-src 'self' https://www.google-analytics.com https://www.googletagmanager.com 'unsafe-inlin..."
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('filters CSP unsafe-eval compile/instatiate errors', () => {
      const originalException = new Error(
        "Refused to compile or instantiate WebAssembly module because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: \"script-src 'self' https://www.google-a..."
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('filters WebAssembly compilation errors', () => {
      const originalException = new Error(
        'Aborted(CompileError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder). Build with -sASSERTIONS for more info.'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })
  })

  it('filters AbortErrors', () => {
    const originalException = new DOMException('The user aborted a request.', 'AbortError')
    expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
  })
})
