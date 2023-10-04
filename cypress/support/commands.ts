import 'cypress-hardhat/lib/browser'

import { Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'

import { FeatureFlag } from '../../src/featureFlags'
import { initialState, UserState } from '../../src/state/user/reducer'
import { CONNECTED_WALLET_USER_STATE, setInitialUserState } from '../utils/user-state'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface ApplicationWindow {
      ethereum: Eip1193Bridge
    }
    interface Chainable<Subject> {
      /**
       * Wait for a specific event to be sent to amplitude. If the event is found, the subject will be the event.
       *
       * @param {string} eventName - The type of the event to search for e.g. SwapEventName.SWAP_TRANSACTION_COMPLETED
       * @param {number} timeout - The maximum amount of time (in ms) to wait for the event.
       * @returns {Chainable<Subject>}
       */
      waitForAmplitudeEvent(eventName: string, timeout?: number): Chainable<Subject>
    }
    interface VisitOptions {
      serviceWorker?: true
      featureFlags?: Array<FeatureFlag>
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

    return cy
      .intercept('/service-worker.js', options?.serviceWorker ? undefined : { statusCode: 404 })
      .provider()
      .then((provider) =>
        original({
          ...options,
          url,
          onBeforeLoad(win) {
            options?.onBeforeLoad?.(win)

            setInitialUserState(win, {
              ...initialState,
              ...CONNECTED_WALLET_USER_STATE,
              ...(options?.userState ?? {}),
            })

            // Set feature flags, if configured.
            if (options?.featureFlags) {
              const featureFlags = options.featureFlags.reduce((flags, flag) => ({ ...flags, [flag]: 'enabled' }), {})
              win.localStorage.setItem('featureFlags', JSON.stringify(featureFlags))
            }

            // Inject the mock ethereum provider.
            win.ethereum = provider
          },
        })
      )
  }
)

Cypress.Commands.add('waitForAmplitudeEvent', (eventName, timeout = 5000 /* 5s */) => {
  const startTime = new Date().getTime()

  function checkRequest() {
    return cy.wait('@amplitude', { timeout }).then((interception) => {
      const events = interception.request.body.events
      const event = events.find((event: any) => event.event_type === eventName)

      if (event) {
        return cy.wrap(event)
      } else if (new Date().getTime() - startTime > timeout) {
        throw new Error(`Event ${eventName} not found within the specified timeout`)
      } else {
        return checkRequest()
      }
    })
  }
  return checkRequest()
})
