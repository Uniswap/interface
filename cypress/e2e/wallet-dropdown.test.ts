import { getTestSelector } from '../utils'

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
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-settings')).click()
    cy.get(getTestSelector('theme-lightmode')).click()

    cy.get(getTestSelector('theme-lightmode')).should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.get(getTestSelector('theme-darkmode')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.get(getTestSelector('theme-auto')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')

    cy.get(getTestSelector('theme-darkmode')).click()
    cy.get(getTestSelector('theme-lightmode')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.get(getTestSelector('theme-darkmode')).should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.get(getTestSelector('theme-auto')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')

    cy.get(getTestSelector('theme-auto')).click()
    cy.get(getTestSelector('theme-lightmode')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.get(getTestSelector('theme-darkmode')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.get(getTestSelector('theme-auto')).should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
  })

  it('should select a language', () => {
    cy.get(getTestSelector('wallet-language-item')).contains('Deutsch').click({ force: true })
    cy.get(getTestSelector('wallet-header')).should('contain', 'Sprache')
    cy.get(getTestSelector('wallet-language-item')).contains('English').click({ force: true })
    cy.get(getTestSelector('wallet-header')).should('contain', 'Language')
    cy.get(getTestSelector('wallet-back')).click()
  })

  it('should change the theme when not connected', () => {
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.get(getTestSelector('wallet-settings')).click()
    cy.get(getTestSelector('theme-lightmode')).should('exist')
  })

  it('should select a language when not connected', () => {
    cy.get(getTestSelector('wallet-language-item')).contains('Deutsch').click({ force: true })
    cy.get(getTestSelector('wallet-header')).should('contain', 'Sprache')
    cy.get(getTestSelector('wallet-language-item')).contains('English').click({ force: true })
    cy.get(getTestSelector('wallet-header')).should('contain', 'Language')
    cy.get(getTestSelector('wallet-back')).click()
  })

  it('should properly use dark system theme when auto theme setting is selected', () => {
    visit(true)
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-settings')).click()
    cy.get(getTestSelector('theme-auto')).click()
    cy.get(getTestSelector('wallet-header')).should('have.css', 'color', 'rgb(152, 161, 192)')
  })

  it('should properly use light system theme when auto theme setting is selected', () => {
    visit(false)
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-settings')).click()
    cy.get(getTestSelector('theme-auto')).click()
    cy.get(getTestSelector('wallet-header')).should('have.css', 'color', 'rgb(119, 128, 160)')
  })

  it('should dismiss the wallet bottom sheet when clicking buy crypto', () => {
    visit(false)
    cy.viewport('iphone-6')
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-buy-crypto')).click()
    cy.contains('Buy crypto').should('not.be.visible')
  })

  it('should use a bottom sheet and dismiss when on a mobile screen size', () => {
    visit(true)
    cy.viewport('iphone-6')
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.root().click(15, 40)
    cy.get(getTestSelector('wallet-settings')).should('not.be.visible')
  })
})
