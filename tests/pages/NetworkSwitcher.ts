export class NetworkSwitcher {
  static ethereum() {
    return cy.get('[data-testid=ethereum-network-button]')
  }
  static arbitrum() {
    return cy.get('[data-testid=arbitrum-one-network-button]')
  }
  static gnosis() {
    return cy.get('[data-testid=gnosis-chain-network-button]')
  }
  static rinkeby() {
    return cy.get('[data-testid=rinkeby-network-button]')
  }
  static arinkeby() {
    return cy.get('[data-testid=a-rinkeby-network-button]')
  }
}
