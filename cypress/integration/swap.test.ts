describe('Swap', () => {
  describe('base functionality', () => {
    beforeEach(() => {
      cy.visit('/swap')
    })
    it('can enter an amount into input', () => {
      cy.get('#swap-currency-input .token-amount-input')
        .type('0.001', { delay: 300 })
        .should('have.value', '0.001')
    })

    it('zero swap amount', () => {
      cy.get('#swap-currency-input .token-amount-input')
        .type('0.0', { delay: 200 })
        .should('have.value', '0.0')
    })

    it('invalid swap amount', () => {
      cy.get('#swap-currency-input .token-amount-input')
        .type('\\', { delay: 200 })
        .should('have.value', '')
    })

    it('can enter an amount into output', () => {
      cy.get('#swap-currency-output .token-amount-input')
        .type('0.001', { delay: 200 })
        .should('have.value', '0.001')
    })

    it('zero output amount', () => {
      cy.get('#swap-currency-output .token-amount-input')
        .type('0.0', { delay: 200 })
        .should('have.value', '0.0')
    })

    it('can swap FUSE for DAI', () => {
      cy.get('#swap-currency-output .open-currency-select-button').click()
      cy.get('.token-item-0x94Ba7A27c7A95863d1bdC7645AC2951E0cca06bA').should('be.visible')
      cy.get('.token-item-0x94Ba7A27c7A95863d1bdC7645AC2951E0cca06bA').click({ force: true })
      cy.get('#swap-currency-input .token-amount-input').should('be.visible')
      cy.get('#swap-currency-input .token-amount-input').type('0.001', { force: true, delay: 200 })
      cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
      cy.get('#swap-button')
    })

    it('add a recipient does not exist unless in expert mode', () => {
      cy.get('#add-recipient-button').should('not.exist')
    })

    describe('expert mode', () => {
      beforeEach(() => {
        cy.window().then(win => {
          cy.stub(win, 'prompt').returns('confirm')
        })
        cy.get('#open-settings-dialog-button').click()
        cy.get('#toggle-expert-mode-button').click({ force: true })
        cy.get('#confirm-expert-mode').click({ force: true })
      })

      it('add a recipient is visible', () => {
        cy.get('#add-recipient-button').should('be.visible')
      })

      it('add a recipient', () => {
        cy.get('#add-recipient-button').click()
        cy.get('#recipient').should('exist')
      })

      it('remove recipient', () => {
        cy.get('#add-recipient-button').click()
        cy.get('#remove-recipient-button').click()
        cy.get('#recipient').should('not.exist')
      })
    })
  })

  it('/swap/FUSE should load right FUSE currency', () => {
    cy.visit('/swap/FUSE')
    cy.get('#swap-currency-output .token-symbol-container').should('contain.text', 'FUSE')
  })
})
