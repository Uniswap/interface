describe('Bridge', () => {
  describe('Fuse', () => {
    it('can enter an amount into input', () => {
      cy.visit('/bridge')
      cy.get('.token-amount-input')
        .type('0.001', { delay: 200 })
        .should('have.value', '0.001')
    })

    it('zero swap amount', () => {
      cy.visit('/bridge')
      cy.get('.token-amount-input')
        .type('0.0', { delay: 200 })
        .should('have.value', '0.0')
    })

    it('invalid swap amount', () => {
      cy.visit('/bridge')
      cy.get('.token-amount-input')
        .type('\\', { delay: 200 })
        .should('have.value', '')
    })

    it('can enter an amount into output', () => {
      cy.visit('/bridge')
      cy.get('.token-amount-input')
        .type('0.001', { delay: 200 })
        .should('have.value', '0.001')
    })

    it('zero output amount', () => {
      cy.visit('/bridge')
      cy.get('.token-amount-input')
        .type('0.0', { delay: 200 })
        .should('have.value', '0.0')
    })

    // TODO: Test load token from storage
  })
})
