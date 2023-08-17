import { SwapEventName } from '@uniswap/analytics-events'
import { USDC_MAINNET } from 'constants/tokens'

import { getTestSelector } from '../../utils'

describe('Swap inputs with no wallet connected', () => {
  it('can input and load a quote with no wallet connected', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

    cy.get(getTestSelector('web3-status-connected')).click()
    // click twice, first time to show confirmation, second to confirm
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.get(getTestSelector('wallet-disconnect')).should('contain', 'Disconnect')
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.get(getTestSelector('close-account-drawer')).click()

    // Enter amount to swap
    cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
    cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')
    // Verify logging
    cy.waitForAmplitudeEvent(SwapEventName.SWAP_QUOTE_RECEIVED).then((event: any) => {
      cy.wrap(event.event_properties).should('have.property', 'quote_latency_milliseconds')
      cy.wrap(event.event_properties.quote_latency_milliseconds).should('be.a', 'number')
      cy.wrap(event.event_properties.quote_latency_milliseconds).should('be.gte', 0)
    })
  })
})
