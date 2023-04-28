// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import '@cypress/code-coverage/support'
import 'cypress-hardhat/lib/browser'

import { Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'
import assert from 'assert'

import { FeatureFlag } from '../../src/featureFlags/flags/featureFlags'
import { UserState } from '../../src/state/user/reducer'
import { CONNECTED_WALLET_USER_STATE } from '../utils/user-state'
import { injected } from './ethereum'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface ApplicationWindow {
      ethereum: Eip1193Bridge
    }
    interface VisitOptions {
      serviceWorker?: true
      featureFlags?: Array<FeatureFlag>
      /**
       * The mock ethereum provider to inject into the page.
       * @default 'goerli'
       */
      // TODO(INFRA-175): Migrate all usage of 'goerli' to 'hardhat'.
      ethereum?: 'goerli' | 'hardhat'
      /**
       * Initial user state.
       * @default {@type import('../utils/user-state').CONNECTED_WALLET_USER_STATE}
       */
      userState?: Partial<UserState>
    }
  }
}

// sets up the injected provider to be a mock ethereum provider with the given mnemonic/index
// eslint-disable-next-line no-undef
Cypress.Commands.overwrite(
  'visit',
  (original, url: string | Partial<Cypress.VisitOptions>, options?: Partial<Cypress.VisitOptions>) => {
    assert(typeof url === 'string')

    // Add a hash in the URL if it is not present (to use hash-based routing correctly with queryParams).
    let hashUrl = url.startsWith('/') && url.length > 2 && !url.startsWith('/#') ? `/#${url}` : url
    if (options?.ethereum === 'goerli') hashUrl += `${url.includes('?') ? '&' : '?'}chain=goerli`

    return cy
      .intercept('/service-worker.js', options?.serviceWorker ? undefined : { statusCode: 404 })
      .provider()
      .then((provider) =>
        original({
          ...options,
          url: hashUrl,
          onBeforeLoad(win) {
            options?.onBeforeLoad?.(win)

            // We want to test from a clean state, so we clear the local storage (which clears redux).
            win.localStorage.clear()

            // Set initial user state.
            win.localStorage.setItem(
              'redux_localstorage_simple_user', // storage key for the user reducer using 'redux-localstorage-simple'
              JSON.stringify(options?.userState ?? CONNECTED_WALLET_USER_STATE)
            )

            // Set feature flags, if configured.
            if (options?.featureFlags) {
              const featureFlags = options.featureFlags.reduce((flags, flag) => ({ ...flags, [flag]: 'enabled' }), {})
              win.localStorage.setItem('featureFlags', JSON.stringify(featureFlags))
            }

            // Inject the mock ethereum provider.
            if (options?.ethereum === 'hardhat') {
              win.ethereum = provider
            } else {
              win.ethereum = injected
            }
          },
        })
      )
  }
)

beforeEach(() => {
  // Many API calls enforce that requests come from our app, so we must mock Origin and Referer.
  cy.intercept('*', (req) => {
    req.headers['referer'] = 'https://app.uniswap.org'
    req.headers['origin'] = 'https://app.uniswap.org'
  })
    // Infura uses a test endpoint, which allow-lists http://localhost:3000 instead.
    .intercept(/infura.io/, (req) => {
      req.headers['referer'] = 'http://localhost:3000'
      req.headers['origin'] = 'http://localhost:3000'
      req.alias = req.body.method
      req.continue()
    })
    // Mock Amplitude responses to avoid analytics from tests.
    .intercept('https://api.uniswap.org/v1/amplitude-proxy', (req) => {
      const requestBody = JSON.stringify(req.body)
      const byteSize = new Blob([requestBody]).size
      req.reply(
        JSON.stringify({
          code: 200,
          server_upload_time: Date.now(),
          payload_size_bytes: byteSize,
          events_ingested: req.body.events.length,
        })
      )
    })
})

Cypress.on('uncaught:exception', () => {
  // returning false here prevents Cypress from failing the test
  return false
})
