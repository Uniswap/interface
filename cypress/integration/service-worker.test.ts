describe('ServiceWorker', () => {
  it('installs and serves a document from the ServiceWorker', () => {
    cy.visit('/').get('#swap-page')
    cy.window().its('__isDocumentCached').should('equal', undefined)
    cy.log('activate ServiceWorker').then(
      () =>
        new Cypress.Promise((resolve) => {
          waitForServiceWorkerRegistration()

          function waitForServiceWorkerRegistration() {
            navigator.serviceWorker
              .getRegistration()
              .then((serviceWorker) => serviceWorker?.active)
              .then((active) => {
                if (active) return resolve()
                waitForServiceWorkerRegistration()
              })
          }
        })
    )

    cy.reload().get('#swap-page')
    cy.window().its('__isDocumentCached').should('equal', true)
  })
})
