import { RewardsPage } from '../../../pages/RewardsPage'

describe('Rewards Page test', () => {
    before(() => {
      cy.visit('/rewards?chainId=1')
    })
    it('Should check all buttons and items on Rewards Page', () => {
        RewardsPage.campaignsAndExpiredCampaigns_Buttons().should('be.visible')
        RewardsPage.creeateCapmaign_Button().should('be.visible')
        RewardsPage.searchAPair_ModalWindow().should('be.visible')
        RewardsPage.searchAPair_Field().should('be.visible')
        RewardsPage.myPairs_ToggleSwitch().should('be.visible')
    })
    
  })