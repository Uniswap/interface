import { RouteHandlerCallbackOptions, RouteMatchCallbackOptions } from 'workbox-core'

import { CachedDocument, DocumentRoute, handleDocument, matchDocument } from './document'

jest.mock('workbox-navigation-preload', () => ({ enable: jest.fn() }))
jest.mock('workbox-precaching', () => ({ matchPrecache: jest.fn() }))
jest.mock('workbox-routing', () => ({ Route: class {} }))

describe('document', () => {
  describe('matchDocument', () => {
    const TEST_DOCUMENTS = [
      [{ request: {}, url: { hostname: 'app.uniswap.org', pathname: '' } }, false],
      [{ request: { mode: 'navigate' }, url: { hostname: 'app.uniswap.org', pathname: '' } }, true],
      [{ request: { mode: 'navigate' }, url: { hostname: 'app.uniswap.org', pathname: '/path.gif' } }, false],
      [{ request: { mode: 'navigate' }, url: { hostname: 'example.com', pathname: '' } }, false],
      [{ request: {}, url: { hostname: 'localhost', pathname: '' } }, false],
      [{ request: { mode: 'navigate' }, url: { hostname: 'localhost', pathname: '' } }, true],
    ] as [RouteMatchCallbackOptions, boolean][]

    it.each(TEST_DOCUMENTS)('%o', (document: RouteMatchCallbackOptions, expected: boolean) => {
      jest.spyOn(window, 'location', 'get').mockReturnValue({ hostname: document.url.hostname } as Location)
      expect(matchDocument(document)).toBe(expected)
    })
  })

  describe('handleDocument', () => {
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

      const result = await handle({
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

      const result = await handle({
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
