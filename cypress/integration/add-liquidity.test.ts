describe('Add Liquidity', () => {
  it('loads the two correct tokens', () => {
    cy.visit('/add/0xaD6D458402F60fD3Bd25163575031ACDce07538D-0xc778417E063141139Fce010982780140Aa0cD5Ab')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'DAI')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'ETH')
  })

  it('does not crash if ETH is duplicated', () => {
    cy.visit('/add/0xc778417E063141139Fce010982780140Aa0cD5Ab-0xc778417E063141139Fce010982780140Aa0cD5Ab')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'ETH')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('not.contain.text', 'ETH')
  })

  it('token not in storage is loaded', () => {
    cy.visit('/add/0x5284fAB1638D281ECC18A8d6645aE2D4af6ebe8F-0xc778417E063141139Fce010982780140Aa0cD5Ab')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'CERU')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'WETH')
  })

  it('single token can be selected', () => {
    cy.visit('/add/0x5284fAB1638D281ECC18A8d6645aE2D4af6ebe8F')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'CERU')
    cy.visit('/add/0xaD6D458402F60fD3Bd25163575031ACDce07538D')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'DAI')
  })

  it('redirects /add/token-token to add/token/token', () => {
    cy.visit('/add/0xb290b2f9f8f108d03ff2af3ac5c8de6de31cdf6d-0xaD6D458402F60fD3Bd25163575031ACDce07538D')
    cy.url().should(
      'contain',
      '/add/0xb290b2f9f8f108d03ff2af3ac5c8de6de31cdf6d/0xaD6D458402F60fD3Bd25163575031ACDce07538D'
    )
  })

  it('redirects /add/WETH-token to /add/WETH-address/token', () => {
    cy.visit('/add/0xc778417E063141139Fce010982780140Aa0cD5Ab-0xaD6D458402F60fD3Bd25163575031ACDce07538D')
    cy.url().should(
      'contain',
      '/add/0xc778417E063141139Fce010982780140Aa0cD5Ab/0xaD6D458402F60fD3Bd25163575031ACDce07538D'
    )
  })

  it('redirects /add/token-WETH to /add/token/WETH-address', () => {
    cy.visit('/add/0xaD6D458402F60fD3Bd25163575031ACDce07538D-0xc778417E063141139Fce010982780140Aa0cD5Ab')
    cy.url().should(
      'contain',
      '/add/0xaD6D458402F60fD3Bd25163575031ACDce07538D/0xc778417E063141139Fce010982780140Aa0cD5Ab'
    )
  })
})
