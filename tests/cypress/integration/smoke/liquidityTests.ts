import { LiquidityPage } from '../../../pages/LiquidityPage'

describe('Check Liquidity Page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000/#/pools?chainId=1')
    })
  
    it('Check All Pairs button and campaigns/my pairs toggle switch on Liquidity Page', () => {
      LiquidityPage.allPairs_Button().should('be.visible')
      LiquidityPage.campaignsAndMyPairs_ToggleSwitch().should('be.visible')
    })
   
    it('Check Create Pair button and modal window on Liquidity Page', () => {
      LiquidityPage.createPair_Button().should('be.visible')
      LiquidityPage.createPair_Button().click()
      LiquidityPage.inputFields().should('be.visible')
      LiquidityPage.selectToken_Button().should('be.visible')
    })

    it('Check Select Token modal window on Liquidity Page', () => {
      LiquidityPage.createPair_Button().click()
      LiquidityPage.createAPairInput_Field().should('be.visible')
      LiquidityPage.selectToken_Button().first().click()
      LiquidityPage.tokenSearch_Field().should('be.visible')
    })

  })