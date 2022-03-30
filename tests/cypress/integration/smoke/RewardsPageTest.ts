import { RewardsPage } from '../../../pages/RewardsPage'

describe('Rewards Page test', () => {
    before(() => {
      cy.visit('http://localhost:3000/#/rewards?chainId=100')
    })
    it('Check My pairs toggle switch on Rewards Page', () => {
        RewardsPage.myPairs_ToggleSwitch().should('be.visible')
    })

    it('Check Create Campaign button on Rewards Page', () => {
      RewardsPage.creeateCapmaign_Button().should('be.visible')
    })

    it('Check All pairs and search modal window on Rewards Page', () => {
      RewardsPage.allPairs_Button().should('be.visible')
      RewardsPage.allPairs_Button().click()
      RewardsPage.searchAPair_ModalWindow().should('be.visible')
      RewardsPage.searchAPair_Field().should('be.visible')
    })

    it('Rewards list should be displayed on Arbitrum One without connected wallet', () => {
      RewardsPage.endedCmapaign_Card().should('be.visible')
      RewardsPage.endedCmapaign_Card().click()
      RewardsPage.endedCmapaign_Card().first().should('be.visible')
    })

    it('Rewards list should be displayed on Gnosis Chain without connected wallet ', () => {
      
    })


    
  })