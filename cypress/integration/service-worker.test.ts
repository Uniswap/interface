import assert = require('assert')

describe('Service Worker', () => {
  before(async () => {
    // Fail fast if there is no Service Worker on this build.
    const sw = await fetch('./service-worker.js', { headers: { 'Service-Worker': 'script' } })
    const isValid = isValidServiceWorker(sw)
    if (!isValid) {
      throw new Error(
        '\n' +
          'Service Worker tests must be run on a production-like build\n' +
          'To test, build with `yarn build:e2e` and serve with `yarn serve`'
      )
    }

    function isValidServiceWorker(response: Response) {
      const contentType = response.headers.get('content-type')
      return !(response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1))
    }
  })

  beforeEach(() => {
    cy.intercept({ hostname: 'www.google-analytics.com' }, (req) => {
      const body = req.body.toString()
      if (body.includes('ServiceWorker')) {
        if (body.includes('NoServiceWorker')) {
          req.alias = 'NoServiceWorker'
        } else if (body.includes('CacheHit')) {
          req.alias = 'CacheHit'
        } else if (body.includes('CacheMiss')) {
          req.alias = 'CacheMiss'
        }
      }
    }).visit('/')
  })

  it('installs a ServiceWorker', () => {
    cy.get('#swap-page').wait('@NoServiceWorker', { timeout: 30000 })
    precacheReady()
  })

  describe('with a ServiceWorker', () => {
    it('records a cache miss from the ServiceWorker', () => {
      precacheReady()
        // Swap the cache entry with an empty response so that it is "stale".
        .then(async ({ cache, key }) => cache.put(key, new Response()))
        .reload()
        .get('#swap-page')
        .wait('@CacheMiss', { timeout: 30000 })
    })

    it('records a cache hit from the ServiceWorker', () => {
      precacheReady()
        // Augment the cache entry with domain="localhost" so that Cypress can inspect the window.
        .then(async ({ cache, key }) => {
          await cache.delete(key)
          const index = await fetch('/')
          const text = (await index.text()) + '<script>document.domain="localhost"</script>'
          const wrappedIndex = new Response(text, index)
          cache.put(key, wrappedIndex)
        })
        .pause()
        .reload()
        .get('#swap-page')
        .wait('@CacheHit', { timeout: 30000 })
    })
  })

  function precacheReady(): Cypress.Chainable<{ cache: Cache; key: Request }> {
    let cache: Cache
    let key: Request

    return cy
      .window({ timeout: 20000 })
      .and(async () => {
        const sw = await window.navigator.serviceWorker.ready
        expect(sw?.active?.state).to.equal('activated')
      })
      .and(async () => {
        // Give the SW a chance to open (and lock) the cache.
        await new Promise((resolve) => setTimeout(resolve, 10))

        // Cypress wraps the document to allow for cross-domain inspection,
        // so we must replace the SW's cached index.html with a fetched wrapped index.html.
        const cacheKey = (await window.caches.keys()).find((key) => key.includes('precache'))
        expect(cacheKey).to.match(/precache/)
        assert(cacheKey)
        cache = await caches.open(cacheKey)

        const req = (await cache.keys()).find((req) => req.url.includes('index.html'))
        expect(req?.url).to.match(/index.html/)
        assert(req)
        key = req
      })
      .then(() => ({ cache, key }))
  }
})
