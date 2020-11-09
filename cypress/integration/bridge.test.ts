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

    it('disables transfer when token not approved', () => {
      cy.visit('/bridge/0xE0A41ecBC3C2EF1b356dD14fDE17330d72093fbc')
      cy.get('.token-amount-input').type('0.1', { force: true, delay: 200 })
      cy.get('#bridge-transfer-button').should('be.disabled')
    })

    it('can not transfer when amount is below minimum', () => {
      cy.visit('/bridge/0xE0A41ecBC3C2EF1b356dD14fDE17330d72093fbc')
      cy.get('.token-amount-input').type('0.001', { force: true, delay: 200 })
      cy.get('#bridge-transfer-button').should('contain', 'Below minimum limit')
    })

    it('loads token from storage', () => {
      cy.visit('/bridge')
      cy.get('.open-currency-select-button').click()
      cy.get('.token-item-0x94Ba7A27c7A95863d1bdC7645AC2951E0cca06bA').click({ force: true })
      cy.get('.token-symbol-container').should('contain', 'DAI')
    })

    it('loads token not in storage', () => {
      cy.visit('/bridge/0xE0A41ecBC3C2EF1b356dD14fDE17330d72093fbc')
      cy.get('.token-symbol-container').should('contain', 'USDC')
    })
  })
})
