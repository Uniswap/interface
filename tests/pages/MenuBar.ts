export class MenuBar {
  static connectWallet() {
    cy.get('#connect-wallet')
      .click()
      .get('#connect-METAMASK')
      .click()
      .acceptMetamaskAccess()
  }
  static closeToastAlerts() {
    cy.get('.Toastify__close-button').click({ multiple: true, force: true })
  }
  static checkToastMessage(message: string) {
    cy.get('.Toastify__toast', { timeout: 80000 }).should('contain', message)
    this.closeToastAlerts()
  }
  static getSwap() {
    return cy.get('#swap-nav-link')
  }
  static getLiquidity() {
    return cy.get('#pool-nav-link')
  }
  static getRewards() {
    return cy.get('#rewards-nav-link')
  }
  static getVote() {
    return cy.get('#vote-nav-link')
  }
  static getBridge() {
    return cy.get('#bridge-nav-link')
  }
  static getCharts() {
    return cy.get('#charts-nav-link')
  }
  static getConnectWalletButton() {
    return cy.get('#connect-wallet')
  }
  static getNetworkSwitcher() {
    return cy.get('[data-testid=network-switcher]').first()
  }
  static getSettings() {
    return cy.get('#open-settings-dialog-button')
  }
  static getWeb3Status() {
    return cy.get('#web3-status-connected')
  }
  static checkHrefs() {
    MenuBar.getRewards().should('be.visible')
    MenuBar.getLiquidity().should('be.visible')
    MenuBar.getSwap().should('be.visible')
    MenuBar.getBridge().should('be.visible')
    MenuBar.getCharts().should('be.visible')
    MenuBar.getConnectWalletButton().should('be.visible')
    MenuBar.getNetworkSwitcher().should('be.visible')
    MenuBar.getSettings().should('be.visible')
    return cy.wrap(null)
  }
}
