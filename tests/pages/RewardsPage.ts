export class RewardsPage {
    static visitSwapPage() {
      cy.visit('/rewards?chainId=100')
    }

    //TODO: separate these two buttons
    static campaignsAndExpiredCampaigns_Buttons() {
      return  cy.get('[data-testid=campaigns-and-exipred]')
    }
    static creeateCapmaign_Button() {
      return  cy.get('[data-testid=create-campaign]')
    }
    static searchAPair_ModalWindow() {
      return  cy.get('[data-testid=select-a-pair]')
    }
    static searchAPair_Field() {
      return  cy.get('[data-testid=search-pair]')
    }
    static myPairs_ToggleSwitch() {
      return  cy.get('.react-switch-button')
    }
    //TODO: Find Selector for ALL pairs button 
}    