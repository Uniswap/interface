import assert = require('assert')

describe('Service Worker', () => {
  before(() => {
    // Fail fast if there is no Service Worker on this build.
    cy.request({ url: '/service-worker.js', headers: { 'Service-Worker': 'script' } }).then((response) => {
      const isValid = isValidServiceWorker(response)
      if (!isValid) {
        throw new Error(
          '\n' +
            'Service Worker tests must be run on a production-like build\n' +
            'To test, build with `yarn build:e2e` and serve with `yarn serve`'
        )
      }
    })

    function isValidServiceWorker(response: Cypress.Response<any>) {
      const contentType = response.headers['content-type']
      return !(response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1))
    }
  })

  function unregister() {
    return cy.log('unregister service worker').then(async () => {
      const cacheKeys = await window.caches.keys()
      const cacheKey = cacheKeys.find((key) => key.match(/precache/))
      if (cacheKey) {
        await window.caches.delete(cacheKey)
      }

      const sw = await window.navigator.serviceWorker.getRegistration(Cypress.config().baseUrl ?? undefined)
      await sw?.unregister()
    })
  }
  before(unregister)
  after(unregister)

  beforeEach(() => {
    cy.intercept({ hostname: 'www.google-analytics.com' }, (req) => {
      const body = req.body.toString()
      if (req.query['ep.event_category'] === 'Service Worker' || body.includes('Service%20Worker')) {
        if (req.query['en'] === 'Not Installed' || body.includes('Not%20Installed')) {
          req.alias = 'NotInstalled'
        } else if (req.query['en'] === 'Cache Hit' || body.includes('Cache%20Hit')) {
          req.alias = 'CacheHit'
        } else if (req.query['en'] === 'Cache Miss' || body.includes('Cache%20Miss')) {
          req.alias = 'CacheMiss'
        }
      }
    })
  })

  it('installs a ServiceWorker', () => {
    cy.visit('/', { serviceWorker: true })
      .get('#swap-page')
      .wait('@NotInstalled', { timeout: 20000 })
      .window({ timeout: 20000 })
      .and((win) => {
        expect(win.navigator.serviceWorker.controller?.state).to.equal('activated')
      })
  })

  it('records a cache hit', () => {
    cy.visit('/', { serviceWorker: true }).get('#swap-page').wait('@CacheHit', { timeout: 20000 })
  })

  it('records a cache miss', () => {
    cy.then(async () => {
      const cacheKeys = await window.caches.keys()
      const cacheKey = cacheKeys.find((key) => key.match(/precache/))
      assert(cacheKey)

      const cache = await window.caches.open(cacheKey)
      const keys = await cache.keys()
      const key = keys.find((key) => key.url.match(/index/))
      assert(key)

      await cache.put(key, new Response())
    })
      .visit('/', { serviceWorker: true })
      .get('#swap-page')
      .wait('@CacheMiss', { timeout: 20000 })
  })
})
