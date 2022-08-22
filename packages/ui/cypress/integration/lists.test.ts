describe('Lists', () => {
  beforeEach(() => {
    cy.visit('/swap')
  })

  // @TODO check if default lists are active when we have them
  it('change list', () => {
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get('.list-token-manage-button').click()
  })
})
