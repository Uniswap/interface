import { ErrorEvent } from '@sentry/types'

import { filterKnownErrors } from './errors'

Object.defineProperty(window.performance, 'getEntriesByType', {
  writable: true,
  value: jest.fn(),
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

  it('filters block number polling errors', () => {
    const originalException = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber' })
    })()
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })

  it('filters network change errors', () => {
    const originalException = new Error('underlying network changed')
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })

  it('filters user rejected request errors', () => {
    const originalException = new Error('user rejected transaction')
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })

  it('filters invalid HTML response errors', () => {
    const originalException = new SyntaxError("Unexpected token '<'")
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })

  describe('chunk errors', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('filters 499 error coded chunk error', () => {
      jest.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
        {
          name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
          responseStatus: 499,
        } as PerformanceEntry,
      ])
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('keeps error when status is different than 499', () => {
      jest.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
        {
          name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
          responseStatus: 200,
        } as PerformanceEntry,
      ])
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).not.toBeNull()
    })

    it('filters out error when resource is missing', () => {
      jest.spyOn(window.performance, 'getEntriesByType').mockReturnValue([])
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('filters out error when performance is undefined', () => {
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('filters out error when responseStatus is undefined', () => {
      jest.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
        {
          name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
        } as PerformanceEntry,
      ])
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })
  })

  describe('Content Security Policy', () => {
    it('filters unsafe-eval evaluate errors', () => {
      const originalException = new Error(
        "Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: \"script-src 'self' https://www.google-analytics.com https://www.googletagmanager.com 'unsafe-inlin..."
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
    })

    it('filters CSP unsafe-eval compile/instatiate errors', () => {
      const originalException = new Error(
        "Refused to compile or instantiate WebAssembly module because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: \"script-src 'self' https://www.google-a..."
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
    })
  })
})
