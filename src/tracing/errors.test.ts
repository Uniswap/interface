import { ErrorEvent } from '@sentry/types'

import { filterKnownErrors } from './errors'

describe('filterKnownErrors', () => {
  const ERROR = {} as ErrorEvent
  it('propagates an error', () => {
    expect(filterKnownErrors(ERROR, {})).toBe(ERROR)
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
      const mockGetEntriesByType = jest.fn(() => {
        return [
          {
            name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
            responseStatus: 499,
          },
        ] as any
      })
      window.performance.getEntriesByType = mockGetEntriesByType
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('keeps error when status is different than 499', () => {
      const mockGetEntriesByType = jest.fn(() => {
        return [
          {
            name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
            responseStatus: 200,
          },
        ] as any
      })
      window.performance.getEntriesByType = mockGetEntriesByType
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).not.toBeNull()
    })

    it('filters out error when resource is missing', () => {
      const mockGetEntriesByType = jest.fn(() => {
        return []
      })
      window.performance.getEntriesByType = mockGetEntriesByType
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
      const mockGetEntriesByType = jest.fn(() => {
        return [
          {
            name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
          },
        ] as any
      })
      window.performance.getEntriesByType = mockGetEntriesByType
      const originalException = new Error(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })
  })
})
