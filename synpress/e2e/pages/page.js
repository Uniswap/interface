export default class Page {
  visit(path) {
    cy.visit(path);
  }
  getTitle() {
    return cy.title();
  }

  getMetamaskWalletAddress() {
    return cy.fetchMetamaskWalletAddress();
  }

  acceptMetamaskAccessRequest() {
    cy.acceptMetamaskAccess();
  }
}
