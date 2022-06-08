describe('ServiceWorker', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('serves a cached document from the ServiceWorker', () => {
    cy.window().then((window) => {
      expect((window as any).__isDocumentCached).to.equal(undefined)
    })

    cy.then(
      () =>
        new Cypress.Promise((resolve) => {
          waitForServiceWorkerRegistration()

          function waitForServiceWorkerRegistration() {
            navigator.serviceWorker
              .getRegistration()
              .then((serviceWorker) => serviceWorker?.active)
              .then((active) => {
                if (!active) throw new Error('ServiceWorker not active')
              })
              .then(resolve)
              .catch(waitForServiceWorkerRegistration)
          }
        })
    )
    cy.reload()

    cy.window().then((window) => {
      expect((window as any).__isDocumentCached).to.equal(true)
    })
  })
})
