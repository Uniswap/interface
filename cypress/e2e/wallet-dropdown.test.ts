function visit(darkMode: boolean) {
  cy.visit('/swap', {
    onBeforeLoad(win) {
      cy.stub(win, 'matchMedia')
        .withArgs('(prefers-color-scheme: dark)')
        .returns({
          matches: darkMode,
          addEventListener() {
            // do nothing
          },
        })
    },
  })
}

describe('Wallet Dropdown', () => {
  before(() => {
    cy.visit('/pools')
  })

  it('should change the theme', () => {
    cy.getByTestId('web3-status-connected').click()
    cy.getByTestId('wallet-settings').click()
    cy.getByTestId('theme-lightmode').click()

    cy.getByTestId('theme-lightmode').should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.getByTestId('theme-darkmode').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.getByTestId('theme-auto').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')

    cy.getByTestId('theme-darkmode').click()
    cy.getByTestId('theme-lightmode').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.getByTestId('theme-darkmode').should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.getByTestId('theme-auto').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')

    cy.getByTestId('theme-auto').click()
    cy.getByTestId('theme-lightmode').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.getByTestId('theme-darkmode').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.getByTestId('theme-auto').should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
  })

  it('should select a language', () => {
    cy.getByTestId('wallet-language-item').contains('Deutsch').click({ force: true })
    cy.getByTestId('wallet-header').should('contain', 'Sprache')
    cy.getByTestId('wallet-language-item').contains('English').click({ force: true })
    cy.getByTestId('wallet-header').should('contain', 'Language')
    cy.getByTestId('wallet-back').click()
  })

  it('should change the theme when not connected', () => {
    cy.getByTestId('wallet-disconnect').click()
    cy.getByTestId('wallet-settings').click()
    cy.getByTestId('theme-lightmode').should('exist')
  })

  it('should select a language when not connected', () => {
    cy.getByTestId('wallet-language-item').contains('Deutsch').click({ force: true })
    cy.getByTestId('wallet-header').should('contain', 'Sprache')
    cy.getByTestId('wallet-language-item').contains('English').click({ force: true })
    cy.getByTestId('wallet-header').should('contain', 'Language')
    cy.getByTestId('wallet-back').click()
  })

  it('should properly use dark system theme when auto theme setting is selected', () => {
    visit(true)
    cy.getByTestId('web3-status-connected').click()
    cy.getByTestId('wallet-settings').click()
    cy.getByTestId('theme-auto').click()
    cy.getByTestId('wallet-header').should('have.css', 'color', 'rgb(152, 161, 192)')
  })

  it('should properly use light system theme when auto theme setting is selected', () => {
    visit(false)
    cy.getByTestId('web3-status-connected').click()
    cy.getByTestId('wallet-settings').click()
    cy.getByTestId('theme-auto').click()
    cy.getByTestId('wallet-header').should('have.css', 'color', 'rgb(119, 128, 160)')
  })

  it('should dismiss the wallet bottom sheet when clicking buy crypto', () => {
    visit(false)
    cy.viewport('iphone-6')
    cy.getByTestId('web3-status-connected').click()
    cy.getByTestId('wallet-buy-crypto').click()
    cy.contains('Buy crypto').should('not.be.visible')
  })

  it('should use a bottom sheet and dismiss when on a mobile screen size', () => {
    visit(true)
    cy.viewport('iphone-6')
    cy.getByTestId('web3-status-connected').click()
    cy.root().click(15, 40)
    cy.getByTestId('wallet-settings').should('not.be.visible')
  })
})
