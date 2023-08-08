describe('Remove Liquidity', () => {
  it('loads the token pair', () => {
    cy.visit('/remove/v2/ETH/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'ETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'UNI')
  })
})
