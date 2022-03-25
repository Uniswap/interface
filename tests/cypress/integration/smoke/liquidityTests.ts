import { LiquidityPage } from '../../../pages/LiquidityPage'

describe('Check Liquidity Page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000/#/pools?chainId=1')
    })
  
    it('Check all buttons and elements on Liquidity Page', () => {
      LiquidityPage.allPairs_Button().should('be.visible')
      LiquidityPage.campaignsAndMyPairs_ToggleSwitch().should('be.visible')
      LiquidityPage.createPair_Button().should('be.visible')
      LiquidityPage.createPair_Button().click()
      LiquidityPage.inputFields().should('be.visible')
      LiquidityPage.selectToken_Button().should('be.visible')
    })
   
  })