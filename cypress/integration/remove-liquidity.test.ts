describe('Remove Liquidity', () => {
  it('redirects', () => {
    cy.visit('/remove/0x5284fAB1638D281ECC18A8d6645aE2D4af6ebe8F-0xaD6D458402F60fD3Bd25163575031ACDce07538D')
    cy.url().should(
      'contain',
      '/remove/0x5284fAB1638D281ECC18A8d6645aE2D4af6ebe8F/0xaD6D458402F60fD3Bd25163575031ACDce07538D'
    )
  })

  it('eth remove', () => {
    cy.visit('/remove/ETH/0x5284fAB1638D281ECC18A8d6645aE2D4af6ebe8F')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'ETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'CERU')
  })

  it('eth remove swap order', () => {
    cy.visit('/remove/0x5284fAB1638D281ECC18A8d6645aE2D4af6ebe8F/ETH')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'CERU')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'ETH')
  })

  it('loads the two correct tokens', () => {
    cy.visit('/remove/0xc778417E063141139Fce010982780140Aa0cD5Ab-0x5284fAB1638D281ECC18A8d6645aE2D4af6ebe8F')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'CERU')
  })

  it('does not crash if ETH is duplicated', () => {
    cy.visit('/remove/0xc778417E063141139Fce010982780140Aa0cD5Ab-0xc778417E063141139Fce010982780140Aa0cD5Ab')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'WETH')
  })

  it('token not in storage is loaded', () => {
    cy.visit('/remove/0x5284fAB1638D281ECC18A8d6645aE2D4af6ebe8F-0xaD6D458402F60fD3Bd25163575031ACDce07538D')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'CERU')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'DAI')
  })
})
