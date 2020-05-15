describe('Swap', () => {
  beforeEach(() => cy.visit('/swap'))
  it('can enter an amount into input', () => {
    cy.get('#swap-currency-input .token-amount-input')
      .type('0.001')
      .should('have.value', '0.001')
  })

  it('zero swap amount', () => {
    cy.get('#swap-currency-input .token-amount-input')
      .type('0.0')
      .should('have.value', '0.0')
  })

  it('invalid swap amount', () => {
    cy.get('#swap-currency-input .token-amount-input')
      .type('\\')
      .should('have.value', '')
  })

  it('can enter an amount into output', () => {
    cy.get('#swap-currency-output .token-amount-input')
      .type('0.001')
      .should('have.value', '0.001')
  })

  it('zero output amount', () => {
    cy.get('#swap-currency-output .token-amount-input')
      .type('0.0')
      .should('have.value', '0.0')
  })

  it('can swap ETH for DAI', () => {
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get('.token-item-0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735').click()
    cy.get('#swap-currency-input .token-amount-input').type('0.001')
    cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
    cy.get('#show-advanced').click()
    cy.get('#swap-button').click()
    cy.get('#confirm-swap-or-send').should('contain', 'Confirm Swap')
  })
})
