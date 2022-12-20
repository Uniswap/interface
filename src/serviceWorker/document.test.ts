import { RouteHandlerCallbackOptions, RouteMatchCallbackOptions } from 'workbox-core'
import { getCacheKeyForURL as getCacheKeyForURLMock, matchPrecache as matchPrecacheMock } from 'workbox-precaching'

import { CachedDocument, handleDocument, matchDocument } from './document'

jest.mock('workbox-navigation-preload', () => ({ enable: jest.fn() }))
jest.mock('workbox-precaching', () => ({
  getCacheKeyForURL: jest.fn(),
  matchPrecache: jest.fn(),
}))
jest.mock('workbox-routing', () => ({ Route: class {} }))

describe('document', () => {
  describe('matchDocument', () => {
    const TEST_DOCUMENTS = [
      [{ request: {}, url: { hostname: 'example.com', pathname: '' } }, false],
      [{ request: { mode: 'navigate' }, url: { hostname: 'example.com', pathname: '' } }, false],
      [{ request: {}, url: { hostname: 'app.uniswap.org', pathname: '' } }, false],
      [{ request: { mode: 'navigate' }, url: { hostname: 'app.uniswap.org', pathname: '' } }, true],
      [{ request: { mode: 'navigate' }, url: { hostname: 'app.uniswap.org', pathname: '/#/swap' } }, true],
      [{ request: { mode: 'navigate' }, url: { hostname: 'app.uniswap.org', pathname: '/asset.gif' } }, false],
      [{ request: {}, url: { hostname: 'localhost', pathname: '' } }, false],
      [{ request: { mode: 'navigate' }, url: { hostname: 'localhost', pathname: '' } }, true],
      [{ request: { mode: 'navigate' }, url: { hostname: 'localhost', pathname: '/#/swap' } }, true],
      [{ request: { mode: 'navigate' }, url: { hostname: 'localhost', pathname: '/asset.gif' } }, false],
    ] as [RouteMatchCallbackOptions, boolean][]

    it.each(TEST_DOCUMENTS)('%j', (document: RouteMatchCallbackOptions, expected: boolean) => {
      jest.spyOn(window, 'location', 'get').mockReturnValue({ hostname: document.url.hostname } as Location)
      expect(matchDocument(document)).toBe(expected)
    })
  })

  describe('handleDocument', () => {
    const requestUrl = 'request_url'

    let fetch: jest.SpyInstance
    let getCacheKeyForURL: jest.SpyInstance
    let matchPrecache: jest.SpyInstance
    let options: RouteHandlerCallbackOptions

    beforeAll(() => {
      fetch = jest.spyOn(window, 'fetch')
      getCacheKeyForURL = getCacheKeyForURLMock as unknown as jest.SpyInstance
      matchPrecache = matchPrecacheMock as unknown as jest.SpyInstance
    })

    beforeEach(() => {
      fetch.mockReset()
      getCacheKeyForURL.mockReturnValueOnce(requestUrl)
      options = {
        event: new Event('fetch') as ExtendableEvent,
        request: new Request('http://example.com'),
        url: new URL('http://example.com'),
      }
    })

    describe('when offline', () => {
      let onLine: jest.SpyInstance

      beforeAll(() => {
        onLine = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
      })

      afterAll(() => onLine.mockRestore())

      it('returns a fetched document', async () => {
        const fetched = new Response('test_body')
        fetch.mockResolvedValueOnce(fetched)
        const response = await handleDocument(options)
        expect(fetch).toHaveBeenCalledWith(options.request)
        expect(response.body).toBe(fetched.body)
      })

      it('returns a clone of offlineDocument with an offlineDocument', async () => {
        const offlineDocument = new Response()
        const offlineClone = offlineDocument.clone()
        jest.spyOn(offlineDocument, 'clone').mockReturnValueOnce(offlineClone)
        const response = await handleDocument.call({ offlineDocument }, options)
        expect(fetch).not.toHaveBeenCalled()
        expect(response).toBe(offlineClone)
      })
    })

    describe('with a thrown fetch', () => {
      it('returns a cached response', async () => {
        const cached = new Response('<html><head></head><body>mock</body></html>')
        matchPrecache.mockResolvedValueOnce(cached)
        fetch.mockRejectedValueOnce(new Error())
        const response = await handleDocument(options)
        expect(response).toBeInstanceOf(CachedDocument)
        expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
        expect(await response.text()).toBe(
          '<html><head></head><body><script>window.__isDocumentCached=true</script>mock</body></html>'
        )
      })

      it('rethrows with no cached response', async () => {
        const error = new Error()
        fetch.mockRejectedValueOnce(error)
        await expect(handleDocument(options)).rejects.toThrow(error)
      })
    })

    describe('with a fetched response', () => {
      let fetched: Response
      const FETCHED_ETAGS = 'fetched'

      const expectFetchToHaveBeenCalledWithRequestUrl = () => {
        expect(fetch).toHaveBeenCalledWith(requestUrl, expect.anything())
      }

      beforeEach(() => {
        fetched = new Response('test_body', { headers: { etag: FETCHED_ETAGS } })
        fetch.mockReturnValueOnce(fetched)
      })

      describe('with a cached response', () => {
        let cached: Response

        beforeEach(() => {
          cached = new Response('<html><head></head><body>mock</body></html>', { headers: { etag: 'cached' } })
          matchPrecache.mockResolvedValueOnce(cached)
        })

        describe('with matched etags', () => {
          beforeEach(() => {
            cached.headers.set('etag', FETCHED_ETAGS)
          })

          it('aborts the fetched response', async () => {
            await handleDocument(options)
            const abortSignal = fetch.mock.calls[0][1].signal
            expect(abortSignal.aborted).toBeTruthy()
            expectFetchToHaveBeenCalledWithRequestUrl()
          })

          it('returns the cached response', async () => {
            const response = await handleDocument(options)
            expect(response).toBeInstanceOf(CachedDocument)
            expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
            expect(await response.text()).toBe(
              '<html><head></head><body><script>window.__isDocumentCached=true</script>mock</body></html>'
            )
            expectFetchToHaveBeenCalledWithRequestUrl()
          })
        })

        it(`returns the fetched response with mismatched etags`, async () => {
          const response = await handleDocument(options)
          expect(response.body).toBe(fetched.body)
          expectFetchToHaveBeenCalledWithRequestUrl()
        })
      })

      it(`returns the fetched response with no cached response`, async () => {
        const response = await handleDocument(options)
        expect(response.body).toBe(fetched.body)
        expectFetchToHaveBeenCalledWithRequestUrl()
      })
    })
  })
})
