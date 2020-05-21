describe('Add Liquidity', () => {
  beforeEach(() =>
    cy.visit('/add/0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85-0xc778417E063141139Fce010982780140Aa0cD5Ab')
  )

  it('loads the two correct tokens', () => {
    cy.get('#add-liquidity-input-token0 .token-symbol-container').should('contain', 'MKR')
    cy.get('#add-liquidity-input-token1 .token-symbol-container').should('contain', 'ETH')
  })
})
