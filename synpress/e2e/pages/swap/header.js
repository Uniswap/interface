import Page from "../page";
export default class Header extends Page {
  getUserMenu() {
    return cy.findByTestId("user-menu");
  }
  getTutorialPopup() {
    return cy.xpath("//button[text()='Maybe later']");
  }

  getConnectWalletBtn() {
    return cy.get("#btnConnectWallet");
  }
  getWalletAddress() {
    return cy.get("#web3-status-connected > p");
  }
  getAcceptCheckbox() {
    return cy.get('[type="checkbox"]');
  }
  getMetaMaskWalletOption() {
    return cy.get("#connect-METAMASK");
  }

  getWalletBalance() {
    cy.get("#selectNetwork > div > div > div");
  }
}
