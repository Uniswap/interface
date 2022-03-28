
export class LiquidityPage {
  static visitSwapPage() {
    cy.visit('/pools?chainId=1')
  }
 
  static allPairs_Button() {
    return  cy.get('[data-testid=all-token-list]')
  }
  static createPair_Button() {
    return  cy.get('[data-testid=create-pair]')
  }
  static campaignsAndMyPairs_ToggleSwitch() {
    return cy.get('[data-testid=campaigns-toggle]')
  }  
  static inputFields() {
    return  cy.get('[data-testid=transaction-value-input]')
  }
  static selectToken_Button() {
    return  cy.get('[data-testid=select-token-button]')
  }

}