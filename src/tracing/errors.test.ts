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
    let getEntriesByTypeSpy: jest.SpyInstance

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('filters 499 error coded chunk error', () => {
      const mockGetEntriesByType = jest.fn(() => {
        return [
          {
            name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
            entryType: 'resource',
            startTime: 253.79999999701977,
            duration: 3.0999999940395355,
            initiatorType: 'link',
            nextHopProtocol: 'h2',
            renderBlockingStatus: 'non-blocking',
            workerStart: 254,
            redirectStart: 0,
            redirectEnd: 0,
            fetchStart: 254.19999998807907,
            domainLookupStart: 254.19999998807907,
            domainLookupEnd: 254.19999998807907,
            connectStart: 254.19999998807907,
            secureConnectionStart: 254.19999998807907,
            connectEnd: 254.19999998807907,
            requestStart: 255.09999999403954,
            responseStart: 256,
            responseEnd: 256.8999999910593,
            transferSize: 0,
            encodedBodySize: 227688,
            decodedBodySize: 227688,
            responseStatus: 499,
            serverTiming: [],
          },
        ]
      })
      window.performance.getEntriesByType = mockGetEntriesByType
      const originalException = new SyntaxError(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('keeps 200 error coded chunk error', () => {
      const mockGetEntriesByType = jest.fn(() => {
        return [
          {
            name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
            entryType: 'resource',
            startTime: 253.79999999701977,
            duration: 3.0999999940395355,
            initiatorType: 'link',
            nextHopProtocol: 'h2',
            renderBlockingStatus: 'non-blocking',
            workerStart: 254,
            redirectStart: 0,
            redirectEnd: 0,
            fetchStart: 254.19999998807907,
            domainLookupStart: 254.19999998807907,
            domainLookupEnd: 254.19999998807907,
            connectStart: 254.19999998807907,
            secureConnectionStart: 254.19999998807907,
            connectEnd: 254.19999998807907,
            requestStart: 255.09999999403954,
            responseStart: 256,
            responseEnd: 256.8999999910593,
            transferSize: 0,
            encodedBodySize: 227688,
            decodedBodySize: 227688,
            responseStatus: 200,
            serverTiming: [],
          },
        ]
      })
      window.performance.getEntriesByType = mockGetEntriesByType
      const originalException = new SyntaxError(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).not.toBeNull()
    })

    it('filters out error when resource is missing', () => {
      const mockGetEntriesByType = jest.fn(() => {
        return []
      })
      window.performance.getEntriesByType = mockGetEntriesByType
      const originalException = new SyntaxError(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('filters out error when performance is undefined', () => {
      const mockGetEntriesByType = jest.fn(() => {
        return []
      })
      window.performance.getEntriesByType = mockGetEntriesByType
      const originalException = new SyntaxError(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })

    it('filters out error when responseStatus is undefined', () => {
      const mockGetEntriesByType = jest.fn(() => {
        return [
          {
            name: 'https://app.uniswap.org/static/js/20.d55382e0.chunk.js',
            entryType: 'resource',
            startTime: 253.79999999701977,
            duration: 3.0999999940395355,
            initiatorType: 'link',
            nextHopProtocol: 'h2',
            renderBlockingStatus: 'non-blocking',
            workerStart: 254,
            redirectStart: 0,
            redirectEnd: 0,
            fetchStart: 254.19999998807907,
            domainLookupStart: 254.19999998807907,
            domainLookupEnd: 254.19999998807907,
            connectStart: 254.19999998807907,
            secureConnectionStart: 254.19999998807907,
            connectEnd: 254.19999998807907,
            requestStart: 255.09999999403954,
            responseStart: 256,
            responseEnd: 256.8999999910593,
            transferSize: 0,
            encodedBodySize: 227688,
            decodedBodySize: 227688,
            serverTiming: [],
          },
        ]
      })
      window.performance.getEntriesByType = mockGetEntriesByType
      const originalException = new SyntaxError(
        'Loading chunk 20 failed. (error: https://app.uniswap.org/static/js/20.d55382e0.chunk.js)'
      )
      expect(filterKnownErrors(ERROR, { originalException })).toBeNull()
    })
  })
})
