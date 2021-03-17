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
      cy.visit('/bridge')
      cy.get('.open-currency-select-button').click()
      cy.get('.token-item-0x60C6f3CCb47f2c8d8e3943eBe956A1d6CE19C43E').click({ force: true })
      cy.get('.token-amount-input').type('0.1', { force: true, delay: 200 })
      cy.get('#bridge-transfer-button').should('be.disabled')
    })

    it('loads token from storage', () => {
      cy.visit('/bridge')
      cy.get('.open-currency-select-button').click()
      cy.get('.token-item-0x60C6f3CCb47f2c8d8e3943eBe956A1d6CE19C43E').click({ force: true })
      cy.get('.token-symbol-container').should('contain', 'T1')
    })
  })
})
