const ONE_MINUTE = 60_000

describe(
  'Release',
  {
    pageLoadTimeout: ONE_MINUTE,
    retries: 60,
  },
  () => {
    it('loads swap page', () => {
      // We *must* wait in order to space out the retry attempts.
      cy.wait(ONE_MINUTE).visit('/').get('#swap-page')
    })
  }
)
