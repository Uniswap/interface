// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.ts using ES2015 syntax:
import { injected } from './ethereum'
import assert = require('assert')

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface ApplicationWindow {
      ethereum: typeof injected
    }
    interface VisitOptions {
      serviceWorker?: true
    }
  }
}

// sets up the injected provider to be a mock ethereum provider with the given mnemonic/index
// eslint-disable-next-line no-undef
Cypress.Commands.overwrite(
  'visit',
  (original, url: string | Partial<Cypress.VisitOptions>, options?: Partial<Cypress.VisitOptions>) => {
    assert(typeof url === 'string')

    cy.intercept('/service-worker.js', options?.serviceWorker ? undefined : { statusCode: 404 }).then(() => {
      original({
        ...options,
        url: (url.startsWith('/') && url.length > 2 && !url.startsWith('/#') ? `/#${url}` : url) + '?chain=rinkeby',
        onBeforeLoad(win) {
          options?.onBeforeLoad?.(win)
          win.localStorage.clear()
          win.ethereum = injected
        },
      })
    })
  }
)

beforeEach(() => {
  // Infura security policies are based on Origin headers.
  // These are stripped by cypress because chromeWebSecurity === false; this adds them back in.
  cy.intercept(/infura.io/, (res) => {
    res.headers['origin'] = 'http://localhost:3000'
    res.continue()
  })
})

Cypress.on('uncaught:exception', (_err, _runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
