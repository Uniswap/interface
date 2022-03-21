export class MenuPage {
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
    return cy.get('#stake-nav-link')
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
}
