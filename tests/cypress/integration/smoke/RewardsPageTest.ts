import { RewardsPage } from '../../../pages/RewardsPage'
import { NetworkSwitcher } from '../../../pages/NetworkSwitcher'
import { MenuBar } from '../../../pages/MenuBar'

describe('Rewards Page Smoke Test', () => {
    before(() => {
      cy.visit('http://localhost:3000/#/rewards?chainId=100')
    })
    it('Check My pairs toggle switch on Rewards Page', () => {
        RewardsPage.myPairs_ToggleSwitch().should('be.visible')
    })

    it('Check All pairs and search modal window on Rewards Page', () => {
      RewardsPage.allPairs_Button().should('be.visible')
      RewardsPage.allPairs_Button().click()
      RewardsPage.searchAPair_ModalWindow().should('be.visible')
      RewardsPage.searchAPair_Field().should('be.visible')
      RewardsPage.closeSearchAPairModalWindow_Button().click()
    })

    it('Rewards list active/expired should be displayed on Gnosis Chain without connected wallet', () => {
      MenuBar.getNetworkSwitcher().click()
      NetworkSwitcher.gnosis().should('be.visible')
      NetworkSwitcher.gnosis().click()
      RewardsPage.expiredCampaigns_Button().should('be.visible')
      RewardsPage.expiredCampaigns_Button().click()
      RewardsPage.rewardCard().first().should('be.visible')
      RewardsPage.activeCampaigns_Button().should('be.visible')
      RewardsPage.activeCampaigns_Button().click()
      RewardsPage.rewardCard().first().should('be.visible')
    })

    it('Rewards list active/expired should be displayed on Arbitrum One without connected wallet', () => {
      MenuBar.getNetworkSwitcher().click()
      NetworkSwitcher.arbitrum().should('be.visible')
      NetworkSwitcher.arbitrum().click()
      RewardsPage.expiredCampaigns_Button().should('be.visible')
      RewardsPage.expiredCampaigns_Button().click()
      RewardsPage.rewardCard().first().should('be.visible')
      RewardsPage.activeCampaigns_Button().should('be.visible')
      RewardsPage.activeCampaigns_Button().click()
      RewardsPage.rewardCard().first().should('be.visible')
    })

    it('Rewards list active/expired should be displayed on Ethereum without connected wallet', () => {
      MenuBar.getNetworkSwitcher().click()
      NetworkSwitcher.ethereum().should('be.visible')
      NetworkSwitcher.ethereum().click()
      RewardsPage.expiredCampaigns_Button().should('be.visible')
      RewardsPage.expiredCampaigns_Button().click()
      RewardsPage.rewardCard().first().should('be.visible')
      //TODO: When Active Reward cards exist then uncomment functions down below
      //RewardsPage.activeCampaigns_Button().should('be.visible')
      //RewardsPage.activeCampaigns_Button().click()
      //RewardsPage.rewardCard().first().should('be.visible')
    })

    it('Create Campaign button should be displayed and have href to Create a liquidity mining pool page', () => {
      RewardsPage.createCampaign_Button()
        .should('have.attr', 'href')
        .and('include', '/liquidity-mining/create')
    })
    
  })