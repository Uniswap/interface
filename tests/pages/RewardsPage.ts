export class RewardsPage {
    static visitSwapPage() {
      cy.visit('/rewards?chainId=100')
    }

    
    static activeCmapaigns_Button() {
      return  cy.get('[data-testid=active-campaigns]')
    }
    static expiredCampaigns_Button() {
      return  cy.get('[data-testid=expired-campaigns]')
    }
    static creeateCapmaign_Button() {
      return  cy.get('[data-testid=create-campaign]')
    }
    static allPairs_Button() {
      return  cy.get('[data-testid=all-pairs]')
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
    static endedCmapaign_Card() {
      return  cy.get('[data-testid=ended-campaign]')
    }
    static activeCmapaign_Card() {
      return  cy.get('[data-testid=search-pair]')
    }
    
}    