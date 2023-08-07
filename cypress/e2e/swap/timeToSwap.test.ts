import { SwapEventName } from '@uniswap/analytics-events'

import { USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

describe('time-to-swap logging', () => {
  it('completes two swaps and verifies the TTS logging for the first', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)
    cy.hardhat()

    // First swap in the session:
    // Enter amount to swap
    cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
    cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

    // Submit transaction
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.get(getTestSelector('confirmation-close-icon')).click()

    cy.get(getTestSelector('popups')).contains('Swapped')

    // Verify logging
    cy.waitForAmplitudeEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED).then((event: any) => {
      cy.wrap(event.event_properties).should('have.property', 'time_to_swap')
      cy.wrap(event.event_properties.time_to_swap).should('be.a', 'number')
      cy.wrap(event.event_properties.time_to_swap).should('be.gte', 0)
    })

    // Second swap in the session:
    // Enter amount to swap
    cy.get('#swap-currency-output .token-amount-input').clear().type('1').should('have.value', '1')
    cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

    // Submit transaction
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.get(getTestSelector('confirmation-close-icon')).click()

    cy.get(getTestSelector('popups')).contains('Swapped')
    cy.waitForAmplitudeEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED).then((event: any) => {
      cy.wrap(event.event_properties).should('not.have.property', 'time_to_swap')
    })
  })
})
