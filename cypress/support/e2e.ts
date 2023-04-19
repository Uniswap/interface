// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.ts using ES2015 syntax:
import { injected } from './ethereum'
import assert = require('assert')
import '@cypress/code-coverage/support'

import { FeatureFlag } from '../../src/featureFlags/flags/featureFlags'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface ApplicationWindow {
      ethereum: typeof injected
    }
    interface VisitOptions {
      serviceWorker?: true
      featureFlags?: Array<FeatureFlag>
      /**
       * The mock ethereum provider to inject into the page.
       * @default 'goerli'
       */
      ethereum?: 'goerli' | 'hardhat'
      /** Initial user state, eg {@link import('../utils/user-state').CONNECTED_WALLET_USER_STATE} */
      userState?: object
    }
  }
}

// sets up the injected provider to be a mock ethereum provider with the given mnemonic/index
// eslint-disable-next-line no-undef
Cypress.Commands.overwrite(
  'visit',
  (original, url: string | Partial<Cypress.VisitOptions>, options?: Partial<Cypress.VisitOptions>) => {
    assert(typeof url === 'string')

    let hashUrl = url.startsWith('/') && url.length > 2 && !url.startsWith('/#') ? `/#${url}` : url
    if (options?.ethereum === 'goerli') hashUrl += `${url.includes('?') ? '&' : '?'}chain=goerli`

    return cy
      .intercept('/service-worker.js', options?.serviceWorker ? undefined : { statusCode: 404 })
      .task('hardhat')
      .then((hardhat) =>
        original({
          ...options,
          url: hashUrl,
          onBeforeLoad(win) {
            options?.onBeforeLoad?.(win)

            // We want to test from a clean state, so we clear the local storage (which clears redux).
            win.localStorage.clear()

            // Set user state, if configured.
            if (options?.userState) {
              win.localStorage.setItem('redux_localstorage_simple_user', JSON.stringify(options.userState))
            }

            // Set feature flags, if configured.
            if (options?.featureFlags) {
              const featureFlags = options.featureFlags.reduce((flags, flag) => ({ ...flags, [flag]: 'enabled' }), {})
              win.localStorage.setItem('featureFlags', JSON.stringify(featureFlags))
            }

            // Inject the mock ethereum provider.
            if (options?.ethereum === 'hardhat') {
              console.log(hardhat)
              // TODO(zzmp)
            } else {
              win.ethereum = injected
            }
          },
        })
      )
  }
)

beforeEach(() => {
  // Infura security policies are based on Origin headers.
  // These are stripped by cypress because chromeWebSecurity === false; this adds them back in.
  cy.intercept(/infura.io/, (res) => {
    res.headers['origin'] = 'http://localhost:3000'
    res.alias = res.body.method
    res.continue()
  })

  // Graphql security policies are based on Origin headers.
  // These are stripped by cypress because chromeWebSecurity === false; this adds them back in.
  cy.intercept('https://api.uniswap.org/v1/graphql', (res) => {
    res.headers['origin'] = 'https://app.uniswap.org'
    res.continue()
  })
  cy.intercept('https://beta.api.uniswap.org/v1/graphql', (res) => {
    res.headers['origin'] = 'https://app.uniswap.org'
    res.continue()
  })
})

Cypress.on('uncaught:exception', () => {
  // returning false here prevents Cypress from failing the test
  return false
})
