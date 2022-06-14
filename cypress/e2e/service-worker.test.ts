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
    cy.window().then(async (win) => {
      const cacheKeys = await win.caches.keys()
      const cacheKey = cacheKeys.find((key) => key.match(/precache/))
      if (cacheKey) {
        await win.caches.delete(cacheKey)
      }

      await win.navigator.serviceWorker
        .getRegistration()
        .then((sw) => sw?.unregister())
        .catch(() => undefined)
    })
  }
  before(unregister)
  after(unregister)

  beforeEach(() => {
    cy.intercept({ hostname: 'www.google-analytics.com' }, (req) => {
      const body = req.body.toString()
      if (body.includes('Service%20Worker')) {
        if (body.includes('Not%20Installed')) {
          req.alias = 'NotInstalled'
        } else if (body.includes('Cache%20Hit')) {
          req.alias = 'CacheHit'
        } else if (body.includes('Cache%20Miss')) {
          req.alias = 'CacheMiss'
        }
      }
    })
  })

  it('installs a ServiceWorker', () => {
    cy.visit('/', { serviceWorker: true })
      .get('#swap-page')
      .wait('@NotInstalled', { timeout: 10000 })
      .window({ timeout: 60000 })
      .and(() => {
        expect(window.navigator.serviceWorker.controller?.state).to.equal('activating')
      })
  })

  it('records a cache hit', () => {
    cy.visit('/', { serviceWorker: true }).get('#swap-page').wait('@CacheHit', { timeout: 10000 })
  })

  it('records a cache miss', () => {
    cy.window()
      .then(async (win) => {
        const cacheKeys = await win.caches.keys()
        const cacheKey = cacheKeys.find((key) => key.match(/precache/))
        assert(cacheKey)

        const cache = await win.caches.open(cacheKey)
        const keys = await cache.keys()
        const key = keys.find((key) => key.url.match(/index/))
        assert(key)

        await cache.put(key, new Response())
      })
      .visit('/', { serviceWorker: true })
      .get('#swap-page')
      .wait('@CacheMiss', { timeout: 10000 })
  })
})
