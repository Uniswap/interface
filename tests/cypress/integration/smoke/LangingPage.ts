import { MenuPage } from '../../../pages/MenuPage'
import { NetworkSwitcher } from '../../../pages/NetworkSwitcher'

describe('Landing Page smoke tests', () => {
  before(() => {
    cy.visit('/')
  })
  it('Navigation items should be visible', () => {
    MenuPage.rewards().should('be.visible')
    MenuPage.liquidity().should('be.visible')
    MenuPage.swap().should('be.visible')
    MenuPage.bridge().should('be.visible')
    // MenuPage.charts().should('be.visible')
    MenuPage.connectWalletButton().should('be.visible')
    MenuPage.networkSwitcher().should('be.visible')
    MenuPage.settings().should('be.visible')
  })
  it('navigation items should redirect to correct pages', () => {
    MenuPage.rewards()
      .click()
      .url()
      .should('include', 'rewards')
    MenuPage.liquidity()
      .click()
      .url()
      .should('include', 'pools')
    MenuPage.swap()
      .click()
      .url()
      .should('include', 'swap')
    MenuPage.bridge()
      .click()
      .url()
      .should('include', 'bridge')
  })
  it('Network switcher should display all networks', () => {
    MenuPage.networkSwitcher().click()
    NetworkSwitcher.ethereum().should('be.visible')
    NetworkSwitcher.rinkeby().should('be.visible')
    NetworkSwitcher.arbitrum().should('be.visible')
    NetworkSwitcher.gnosis().should('be.visible')
    NetworkSwitcher.arinkeby().should('be.visible')
  })
})
