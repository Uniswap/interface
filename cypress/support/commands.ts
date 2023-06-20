import 'cypress-hardhat/lib/browser'

import { Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'

import { FeatureFlag } from '../../src/featureFlags'
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
    if (typeof url !== 'string') throw new Error('Invalid arguments. The first argument to cy.visit must be the path.')

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
