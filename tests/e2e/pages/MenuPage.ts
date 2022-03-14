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
}
