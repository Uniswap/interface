import { MenuBar } from '../../../pages/MenuBar'
import { NetworkSwitcher } from '../../../pages/NetworkSwitcher'
import { SettingsDialog } from '../../../pages/SettingsDialog'

describe('Menu bar tests', () => {
  before(() => {
    cy.visit('/')
  })
  it('Should display nav items on every page', () => {
    MenuBar.checkHrefs()
    MenuBar.rewards().click()
    MenuBar.checkHrefs()
    MenuBar.bridge().click()
    MenuBar.checkHrefs()
    MenuBar.liquidity()
    MenuBar.checkHrefs()
  })
  it('Charts and Votes should have href to dxstats and snapshot', () => {
    MenuBar.charts()
      .should('have.attr', 'href')
      .and('include', 'dxstats.eth.link')
    MenuBar.vote()
      .should('have.attr', 'href')
      .and('include', 'snapshot.org/#/swpr.eth')
  })
  it('Should redirect to correct page after clicking on nav item', () => {
    MenuBar.rewards()
      .click()
      .url()
      .should('include', 'rewards')
    MenuBar.liquidity()
      .click()
      .url()
      .should('include', 'pools')
    MenuBar.swap()
      .click()
      .url()
      .should('include', 'swap')
    MenuBar.bridge()
      .click()
      .url()
      .should('include', 'bridge')
  })
  it('Should open network switcher with all networks', () => {
    MenuBar.networkSwitcher().click()
    NetworkSwitcher.ethereum().should('be.visible')
    NetworkSwitcher.rinkeby().should('be.visible')
    NetworkSwitcher.arbitrum().should('be.visible')
    NetworkSwitcher.gnosis().should('be.visible')
    NetworkSwitcher.arinkeby().should('be.visible')
  })
  it('Should open setting dialog', () => {
    MenuBar.settings().click()
    SettingsDialog.get().should('be.visible')
  })
})
