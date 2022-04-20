import { PrecacheEntry } from 'workbox-precaching/_types'
import { RouteHandlerCallbackOptions, RouteMatchCallbackOptions } from 'workbox-core'

import { filterManifest, matchDocument, handleDocument } from './serviceWorker'

describe('service-worker', () => {
  describe('filter manifest files', () => {
    const TEST_ENTRIES = [
      [
        {
          url: 'index.html',
        },
        false,
      ],
      ['inter-roman.var.woff2', true],
      ['comicsans.woff2', false],
      ['main.12345.chunk.js', true],
    ]

    test.each(TEST_ENTRIES)('filterManifest(%p)', (entry: PrecacheEntry | string, expected: boolean) => {
      expect(filterManifest(entry)).toBe(expected)
    })
  })

  describe('match documents', () => {
    const oldWindowLocation = window.location
    beforeAll(() => {
      delete window.location
    })

    const TEST_DOCUMENTS = [
      [{ request: {}, url: { hostname: 'app.uniswap.org', pathname: '' } }, false],
      [{ request: { mode: 'navigate' }, url: { hostname: 'app.uniswap.org', pathname: '' } }, true],
      [{ request: { mode: 'navigate' }, url: { hostname: 'app.uniswap.org', pathname: '/test.gif' } }, false],
      [{ request: { mode: 'navigate' }, url: { hostname: 'random-url.org', pathname: '' } }, false],
    ]

    test.each(TEST_DOCUMENTS)('matchDocument(%o)', (document: RouteMatchCallbackOptions, expected: boolean) => {
      window.location = { hostname: '' }
      expect(matchDocument(document)).toBe(expected)
    })

    it('localhost', () => {
      window.location = { hostname: 'localhost' }
      expect(matchDocument({ request: {}, url: { hostname: '', pathname: '' } })).toBe(false)
      expect(matchDocument({ request: { mode: 'navigate' }, url: { hostname: '', pathname: '' } })).toBe(true)
    })

    afterAll(() => {
      window.location = oldWindowLocation
    })
  })

  describe('handle document', () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort')
    const openSpy = jest.fn()
    const fetchSpy = jest.fn()

    beforeEach(() => {
      global.caches = { open: openSpy } as unknown as CacheStorage
      global.fetch = fetchSpy
    })

    it('returns a new response when the etags don\t match and the response is preloaded', async () => {
      const TEST_ETAG_1 = 'abcde123'
      const TEST_ETAG_2 = 'afgde123'
      const putSpy = jest.fn()
      const cloneSpy = jest.fn()

      openSpy.mockReturnValue(
        Promise.resolve({
          match: (html: string) => {
            return Promise.resolve({
              headers: new Headers({ etag: TEST_ETAG_1 }),
            })
          },
          put: putSpy,
        } as unknown as Cache)
      )

      const response = {
        headers: new Headers({ etag: TEST_ETAG_2 }),
        clone: cloneSpy,
      }

      const result = await handleDocument({
        event: {
          preloadResponse: Promise.resolve(response),
        },
      } as unknown as RouteHandlerCallbackOptions)

      expect(putSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(abortSpy).not.toHaveBeenCalled()
      expect(result).toBe(response)
    })

    it('returns a new response when the etags don\t match and the response is not preloaded', async () => {
      const TEST_ETAG_1 = 'abcde123'
      const TEST_ETAG_2 = 'afgde123'
      const putSpy = jest.fn()
      const cloneSpy = jest.fn()

      openSpy.mockReturnValue(
        Promise.resolve({
          match: (html: string) => {
            return Promise.resolve({
              headers: new Headers({ etag: TEST_ETAG_1 }),
            })
          },
          put: putSpy,
        } as unknown as Cache)
      )

      const response = {
        headers: new Headers({ etag: TEST_ETAG_2 }),
        clone: cloneSpy,
      }

      fetchSpy.mockReturnValue(Promise.resolve(response))

      const result = await handleDocument({
        event: {
          preloadResponse: Promise.resolve(),
        },
      } as unknown as RouteHandlerCallbackOptions)

      expect(putSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledWith('/index.html', expect.any(Object))
      expect(abortSpy).not.toHaveBeenCalled()
      expect(result).toBe(response)
    })

    it('returns a cached response when etags match', async () => {})

    it('sets a local __isDocumentCached variable before caching', async () => {})

    afterEach(() => {
      abortSpy.mockRestore()
      openSpy.mockRestore()
    })
  })
})
