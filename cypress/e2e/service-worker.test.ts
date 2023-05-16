import assert from 'assert'

describe('Service Worker', () => {
  before(() => {
    // Fail fast if there is no Service Worker on this build.
    cy.request({ url: '/service-worker.js', headers: { 'Service-Worker': 'script' } }).then((response) => {
      const isValid = isValidServiceWorker(response)
      if (!isValid) {
        throw new Error(
          '\n' +
            'Service Worker tests must be run on a production-like build\n' +
            'To test, build with `yarn build` and serve with `yarn serve`'
        )
      }
    })

    function isValidServiceWorker(response: Cypress.Response<any>) {
      const contentType = response.headers['content-type']
      return !(response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1))
    }
  })

  after(() => {
    return cy.log('unregisters service worker').then(async () => {
      const sw = await window.navigator.serviceWorker.getRegistration(Cypress.config().baseUrl ?? undefined)
      await sw?.unregister()
    })
  })

  beforeEach(() => {
    cy.intercept('https://api.uniswap.org/v1/amplitude-proxy', (req) => {
      const body = JSON.stringify(req.body)
      const serviceWorkerStatus = body.match(/"service_worker":"(\w+)"/)?.[1]
      if (serviceWorkerStatus) {
        req.alias = `ServiceWorker:${serviceWorkerStatus}`
      }
    })
  })

  it('installs a ServiceWorker and reports the uninstalled status to analytics', () => {
    cy.visit('/', { serviceWorker: true })
    cy.wait('@ServiceWorker:uninstalled')
    cy.window().should(
      'have.nested.property',
      // The parent is checked instead of the AUT because it is on the same origin,
      // and the AUT will not be considered "activated" until the parent is idle.
      'parent.navigator.serviceWorker.controller.state',
      'activated'
    )
  })

  it('records a cache hit and reports the hit to analytics', () => {
    cy.visit('/', { serviceWorker: true })
    cy.wait('@ServiceWorker:hit')
  })

  it('records a cache miss and reports the miss to analytics', () => {
    // Deletes the index.html from the cache to force a cache miss.
    cy.visit('/', { serviceWorker: true })
      .then(async () => {
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
    cy.wait('@ServiceWorker:miss')
  })
})
