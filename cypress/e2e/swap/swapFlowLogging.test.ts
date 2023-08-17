import { SwapEventName } from '@uniswap/analytics-events'

import { USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

describe('completes two swaps and verifies the swap flow logging', () => {
  it('first swap action', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)
    cy.hardhat()

    // First swap in the session:
    // Enter amount to swap
    cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
    cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

    // Verify first swap action
    cy.waitForAmplitudeEvent(SwapEventName.SWAP_FIRST_ACTION).then((event: any) => {
      cy.wrap(event.event_properties).should('have.property', 'time_to_first_swap_action')
      cy.wrap(event.event_properties.time_to_first_swap_action).should('be.a', 'number')
      cy.wrap(event.event_properties.time_to_first_swap_action).should('be.gte', 0)
    })
  })

  it('first swap quote', () => {
    // Verify Swap Quote
    cy.waitForAmplitudeEvent(SwapEventName.SWAP_QUOTE_FETCH).then((event: any) => {
      cy.wrap(event.event_properties).should('have.property', 'time_to_first_quote_request')
      cy.wrap(event.event_properties.time_to_first_quote_request).should('be.a', 'number')
      cy.wrap(event.event_properties.time_to_first_quote_request).should('be.gte', 0)
      cy.wrap(event.event_properties).should('have.property', 'time_to_first_quote_request_since_first_input')
      cy.wrap(event.event_properties.time_to_first_quote_request_since_first_input).should('be.a', 'number')
      cy.wrap(event.event_properties.time_to_first_quote_request_since_first_input).should('be.gte', 0)
    })
  })

  it('first swap success', () => {
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
      cy.wrap(event.event_properties).should('have.property', 'time_to_swap_since_first_input')
      cy.wrap(event.event_properties.time_to_swap_since_first_input).should('be.a', 'number')
      cy.wrap(event.event_properties.time_to_swap_since_first_input).should('be.gte', 0)
    })
  })

  it('second swap', () => {
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
      cy.wrap(event.event_properties).should('not.have.property', 'time_to_swap_since_first_input')
    })
  })
})
