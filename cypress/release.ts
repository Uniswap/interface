const ONE_MINUTE = 60_000

describe(
  'Release',
  {
    pageLoadTimeout: ONE_MINUTE,
    retries: 30,
  },
  () => {
    it('loads swap page', () => {
      // TODO: We *must* wait in order to space out the retry attempts. Find a better way to do this.
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(ONE_MINUTE)
        .visit('/', {
          retryOnStatusCodeFailure: true,
          retryOnNetworkFailure: true,
        })
        .get('#swap-page')
    })
  }
)
