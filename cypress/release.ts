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
      cy.wait(ONE_MINUTE)
        .visit('/', {
          retryOnStatusCodeFailure: true,
          retryOnNetworkFailure: true,
        })
        .get('#swap-page')
    })
  }
)
