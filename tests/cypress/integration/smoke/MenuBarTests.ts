import { MenuBar } from '../../../pages/MenuBar'
import { NetworkSwitcher } from '../../../pages/NetworkSwitcher'
import { SettingsDialog } from '../../../pages/SettingsDialog'

describe('Menu bar smoke tests', () => {
  before(() => {
    cy.visit('/')
  })
  it('Should display nav items on every page [TC-16]', () => {
    MenuBar.checkHrefs()
    MenuBar.getRewards().click()
    MenuBar.checkHrefs()
    MenuBar.getBridge().click()
    MenuBar.checkHrefs()
    MenuBar.getLiquidity()
    MenuBar.checkHrefs()
  })
  it('Charts and Votes should have href to dxstats and snapshot [TC-16]', () => {
    MenuBar.getCharts()
      .should('have.attr', 'href')
      .and('include', 'dxstats.eth.link')
    MenuBar.getVote()
      .should('have.attr', 'href')
      .and('include', 'snapshot.org/#/swpr.eth')
  })
  it('Should redirect to correct page after clicking on nav item [TC-16]', () => {
    MenuBar.getRewards()
      .click()
      .url()
      .should('include', 'rewards')
    MenuBar.getLiquidity()
      .click()
      .url()
      .should('include', 'pools')
    MenuBar.getSwap()
      .click()
      .url()
      .should('include', 'swap')
    MenuBar.getBridge()
      .click()
      .url()
      .should('include', 'bridge')
  })
  it('Should open network switcher with all networks [TC-17]', () => {
    MenuBar.getNetworkSwitcher().click()
    NetworkSwitcher.ethereum().should('be.visible')
    NetworkSwitcher.rinkeby().should('be.visible')
    NetworkSwitcher.arbitrum().should('be.visible')
    NetworkSwitcher.gnosis().should('be.visible')
    NetworkSwitcher.arinkeby().should('be.visible')
  })
  it('Should open settings dialog [TC-18]', () => {
    MenuBar.getSettings().click()
    SettingsDialog.get().should('be.visible')
  })
})
