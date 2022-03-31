export class RewardsPage {
    static visitSwapPage() {
      cy.visit('/rewards?chainId=100')
    }
    
    static activeCampaigns_Button() {
      return  cy.get('[data-testid=active-campaigns]')
    }
    static expiredCampaigns_Button() {
      return  cy.get('[data-testid=expired-campaigns]')
    }
    static createCampaign_Button() {
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
    static closeSearchAPairModalWindow_Button() {
      return  cy.get('[data-testid=close-search-pair]')
    }
    static myPairs_ToggleSwitch() {
      return  cy.get('.react-switch-button')
    }
    static rewardCard() {
      return  cy.get('[data-testid=reward-card]')
    }
    
}    