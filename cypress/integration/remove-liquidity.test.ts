describe('Remove Liquidity', () => {
  it('loads the two correct tokens', () => {
    cy.visit('/remove/0xc778417E063141139Fce010982780140Aa0cD5Ab-0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85')
    cy.get('#remove-liquidity-token0-symbol').should('contain.text', 'ETH')
    cy.get('#remove-liquidity-token1-symbol').should('contain.text', 'MKR')
  })

  it('does not crash if ETH is duplicated', () => {
    cy.visit('/remove/0xc778417E063141139Fce010982780140Aa0cD5Ab-0xc778417E063141139Fce010982780140Aa0cD5Ab')
    cy.get('#remove-liquidity-token0-symbol').should('contain.text', 'ETH')
    cy.get('#remove-liquidity-token1-symbol').should('not.contain.text', 'ETH')
  })

  it('token not in storage is loaded', () => {
    cy.visit('/remove/0xb290b2f9f8f108d03ff2af3ac5c8de6de31cdf6d-0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85')
    cy.get('#remove-liquidity-token0-symbol').should('contain.text', 'SKL')
    cy.get('#remove-liquidity-token1-symbol').should('contain.text', 'MKR')
  })
})
