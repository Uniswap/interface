describe('Remove Liquidity', () => {
  it('eth remove', () => {
    cy.visit('/remove/v2/ETH/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'ETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'UNI')
  })

  it('eth remove swap order', () => {
    cy.visit('/remove/v2/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/ETH')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'UNI')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'ETH')
  })

  it('loads the two correct tokens', () => {
    cy.visit('/remove/v2/0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'UNI')
  })

  it('does not crash if ETH is duplicated', () => {
    cy.visit('/remove/v2/0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6/0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'WETH')
  })
})
