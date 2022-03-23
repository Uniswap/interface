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
    cy.get('.Toastify__toast').should('contain', message)
    this.closeToastAlerts()
  }
  static swap() {
    return cy.get('#swap-nav-link')
  }
  static liquidity() {
    return cy.get('#pool-nav-link')
  }
  static rewards() {
    return cy.get('#rewards-nav-link')
  }
  static vote() {
    return cy.get('#vote-nav-link')
  }
  static bridge() {
    return cy.get('#bridge-nav-link')
  }
  static charts() {
    return cy.get('#charts-nav-link')
  }
  static connectWalletButton() {
    return cy.get('#connect-wallet')
  }
  static networkSwitcher() {
    return cy.get('[data-testid=network-switcher]').first()
  }
  static settings() {
    return cy.get('#open-settings-dialog-button')
  }
  static web3Status() {
    return cy.get('#web3-status-connected')
  }
  static checkHrefs() {
    MenuBar.rewards().should('be.visible')
    MenuBar.liquidity().should('be.visible')
    MenuBar.swap().should('be.visible')
    MenuBar.bridge().should('be.visible')
    MenuBar.charts().should('be.visible')
    MenuBar.connectWalletButton().should('be.visible')
    MenuBar.networkSwitcher().should('be.visible')
    MenuBar.settings().should('be.visible')
    return cy.wrap(null)
  }
}
