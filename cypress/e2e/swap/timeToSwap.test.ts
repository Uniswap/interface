import { SwapEventName } from '@uniswap/analytics-events'

import { USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

describe('time-to-swap logging', () => {
  it('completes two swaps and verifies the TTS logging for the first', () => {
    cy.visit('/swap')
    cy.hardhat({ automine: false })

    // Select USDC
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get(getTestSelector('token-search-input')).type(USDC_MAINNET.address)
    cy.get(getTestSelector('common-base-USDC')).click()

    // Enter amount to swap
    cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
    cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

    // Submit transaction
    cy.get('#swap-button').click()
    cy.contains('Review swap')
    cy.contains('Confirm swap').click()
    cy.wait('@eth_estimateGas').wait('@eth_sendRawTransaction').wait('@eth_getTransactionReceipt')
    cy.contains('Swap submitted')
    cy.get(getTestSelector('confirmation-close-icon')).click()
    cy.contains('Swap submitted').should('not.exist')
    cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')

    // Mine transaction
    cy.hardhat().then((hardhat) => hardhat.mine(1))
    cy.wait('@eth_getTransactionReceipt')
    cy.get(getTestSelector('popups')).contains('Swapped')

    // Verify logging
    cy.waitForEvent('@analytics', SwapEventName.SWAP_TRANSACTION_COMPLETED).then((event: any) => {
      cy.wrap(event.event_properties).should('have.property', 'tts')
      cy.wrap(event.event_properties.tts).should('be.a', 'number')
      cy.wrap(event.event_properties.tts).should('be.gte', 0)
    })
  })
})
