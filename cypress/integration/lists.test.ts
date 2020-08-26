describe('Swap', () => {
  beforeEach(() => cy.visit('/swap'))

  it('list selection persists', () => {
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get('#select-default-uniswap-list .select-button').click()
    cy.reload()
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get('#select-default-uniswap-list').should('not.exist')
  })
})
