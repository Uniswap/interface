import { ErrorEvent } from '@sentry/types'

import { beforeSend } from './errors'

Object.defineProperty(window.performance, 'getEntriesByType', {
  writable: true,
  value: jest.fn(),
})

describe('beforeSend', () => {
  const ERROR = {} as ErrorEvent

  describe('updateRequestUrl', () => {
    test('should remove "/#" from the request URL', () => {
      const event = {
        request: {
          url: 'https://app.uniswap.org/#/example',
        },
      } as ErrorEvent

      beforeSend(event, {})
      expect(event.request?.url).toBe('https://app.uniswap.org/example')
    })

    test('should remove trailing slash from the request URL', () => {
      const event = {
        request: {
          url: 'https://app.uniswap.org/example/',
        },
      } as ErrorEvent

      beforeSend(event, {})
      expect(event.request?.url).toBe('https://app.uniswap.org/example')
    })

    test('should not modify the request URL if no changes are required', () => {
      const event = {
        request: {
          url: 'https://app.uniswap.org/example',
        },
      } as ErrorEvent

      beforeSend(event, {})
      expect(event.request?.url).toBe('https://app.uniswap.org/example')
    })
  })

  it('propagates an error', () => {
    expect(beforeSend(ERROR, {})).toBe(ERROR)
  })

  it('propagates an error with generic text', () => {
    const originalException = new Error('generic error copy')
    expect(beforeSend(ERROR, { originalException })).toBe(ERROR)
  })

  it('propagates user rejected request errors', () => {
    const originalException = new Error('user rejected transaction')
    expect(beforeSend(ERROR, { originalException })).toBe(ERROR)
  })

  it('filters block number polling errors', () => {
    const originalException = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber' })
    })()
    expect(beforeSend(ERROR, { originalException })).toBeNull()
  })

  it('filters network change errors', () => {
    const originalException = new Error('underlying network changed')
    expect(beforeSend(ERROR, { originalException })).toBeNull()
  })

  it('filters invalid HTML response errors', () => {
    const originalException = new SyntaxError("Unexpected token '<'")
    expect(beforeSend(ERROR, { originalException })).toBeNull()
  })

  describe('filters browser extension errors', () => {
    it('filters chrome-extension errors', () => {
      const originalException = new Error()
      originalException.stack = ` 
        TypeError: Cannot create proxy with a non-object as target or handler
          at pa(chrome-extension://kbjhmlgclljgdhmhffjofbobmficicjp/proxy-window-evm.a5430696.js:22:216604)
          at da(chrome-extension://kbjhmlgclljgdhmhffjofbobmficicjp/proxy-window-evm.a5430696.js:22:212968)
          at a(../../../../src/helpers.ts:98:1)
      `
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })

    it('filters moz-extension errors', () => {
      const originalException = new Error()
      originalException.stack = ` 
        Error: Permission denied to access property "apply"
          at WINDOW.onunhandledrejection(../node_modules/@sentry/src/instrument.ts:610:1)
          at y/h.onunhandledrejection(moz-extension://95cafb7b-6038-4bdd-b832-d3a58544601d/content_script/inpage_sol.js:143:16274)
      `
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })
  })

  describe('OneKey', () => {
    it('filter OneKey errors (macOS users)', () => {
      const originalException = new Error()
      originalException.stack = `
        SyntaxError: Unexpected token u in JSON at position 0
          at JSON.parse(<anonymous>)
          at _d._handleAccountChange(/Applications/OneKey.app/Contents/Resources/static/preload.js:2:1634067)
      `
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })
    it('filter OneKey errors (Windows users)', () => {
      const originalException = new Error()
      originalException.stack = `
        SyntaxError: Unexpected token u in JSON at position 0
          at JSON.parse(<anonymous>)
          vd._handleAccountChange(C:\\Users\\example\\AppData\\Local\\Programs\\OneKey\\resources\\static\\preload.js:2:1626130
      `
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })
  })

  describe('Content Security Policy', () => {
    it('filters unsafe-eval evaluate errors', () => {
      const originalException = new Error(
        "Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: \"script-src 'self' https://www.google-analytics.com https://www.googletagmanager.com 'unsafe-inlin..."
      )
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })

    it('filters CSP unsafe-eval compile/instatiate errors', () => {
      const originalException = new Error(
        "Refused to compile or instantiate WebAssembly module because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: \"script-src 'self' https://www.google-a..."
      )
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })

    it('filters WebAssembly compilation errors', () => {
      const originalException = new Error(
        'Aborted(CompileError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder). Build with -sASSERTIONS for more info.'
      )
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })
  })

  it('filters AbortErrors', () => {
    const originalException = new DOMException('The user aborted a request.', 'AbortError')
    expect(beforeSend(ERROR, { originalException })).toBeNull()
  })

  describe('meta tags', () => {
    it('filters apple-mobile-web-app-title errors', () => {
      const originalException = new TypeError(
        "null is not an object (evaluating 'document.querySelector('meta[name=\"apple-mobile-web-app-title\"]').content')"
      )
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })

    it('filters og:site_name errors', () => {
      const originalException = new TypeError(
        "null is not an object (evaluating 'document.querySelector('meta[name=\"og:site_name\"]').content')"
      )
      expect(beforeSend(ERROR, { originalException })).toBeNull()
    })
  })
})
