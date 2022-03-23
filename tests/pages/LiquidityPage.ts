
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
  static campaigns_ToggleSwitch() {
    return cy.get('#CAMPAIGNS')
  }  
  static myPairs_ToggleSwitch() {
    return  cy.get('[data-testid=]')
  }

}