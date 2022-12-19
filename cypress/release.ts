/* eslint cypress/no-unnecessary-waiting: 1 */

const ONE_MINUTE = 60_000

describe(
  'Release',
  {
    pageLoadTimeout: ONE_MINUTE,
    retries: 30,
  },
  () => {
    it('loads swap page', () => {
      // We *must* wait in order to space out the retry attempts.
      // @todo find a better way to do this
      cy.wait(ONE_MINUTE)
        .visit('/', {
          retryOnStatusCodeFailure: true,
          retryOnNetworkFailure: true,
        })
        .get('#swap-page')
    })
  }
)
