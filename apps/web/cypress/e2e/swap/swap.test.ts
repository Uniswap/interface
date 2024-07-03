import { SwapEventName } from '@uniswap/analytics-events'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { UNI, USDC_MAINNET } from '../../../src/constants/tokens'
import { getBalance, getTestSelector } from '../../utils'

const UNI_MAINNET = UNI[UniverseChainId.Mainnet]

describe('Swap', () => {
  // Turn off automine so that intermediate screens are available to assert on.
  before(() => cy.hardhat({ automine: false }))

  describe('Swap on main page', () => {
    it('starts with ETH selected by default', () => {
      cy.visit('/swap')
      cy.get(`#swap-currency-input .token-amount-input`).should('have.value', '')
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'ETH')
      cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'Select token')
    })

    it('should default inputs from URL params ', () => {
      cy.visit(`/swap?inputCurrency=${UNI_MAINNET.address}`)
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'UNI')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'Select token')

      cy.visit(`/swap?outputCurrency=${UNI_MAINNET.address}`)
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'Select token')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'UNI')

      cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${UNI_MAINNET.address}`)
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'ETH')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'UNI')
    })

    it('inputs reset when navigating between pages', () => {
      cy.visit('/swap')
      cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
      cy.get('#swap-currency-input .token-amount-input').type('0.01').should('have.value', '0.01')
      cy.visit('/pool').visit('/swap')
      cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
    })

    it('resets the dependent input when the independent input is cleared', () => {
      cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${UNI_MAINNET.address}`)
      cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
      cy.get(`#swap-currency-output .token-amount-input`).should('have.value', '')

      cy.get('#swap-currency-input .token-amount-input').type('0.01').should('have.value', '0.01')
      cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value', '')
      cy.get('#swap-currency-input .token-amount-input').clear()
      cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')

      cy.window().trigger('blur')
      cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')
    })

    it('swaps ETH for USDC', () => {
      cy.interceptGraphqlOperation('Activity', 'mini-portfolio/empty_activity.json')
      cy.interceptQuoteRequest('swap_eth_usdc_classic.json')
      cy.visit('/swap')
      getBalance(USDC_MAINNET).then((initialBalance) => {
        cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'ETH')

        // Select USDC
        cy.get('#swap-currency-output .open-currency-select-button').click()
        cy.get(getTestSelector('token-search-input')).type(USDC_MAINNET.address)
        cy.get(getTestSelector('common-base-USDC')).click()

        // Enter amount to swap
        cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
        cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

        // Verify logging
        cy.waitForAmplitudeEvent(SwapEventName.SWAP_QUOTE_RECEIVED).then((event: any) => {
          cy.wrap(event.event_properties).should('have.property', 'quote_latency_milliseconds')
          cy.wrap(event.event_properties.quote_latency_milliseconds).should('be.a', 'number')
          cy.wrap(event.event_properties.quote_latency_milliseconds).should('be.gte', 0)
        })

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
        cy.hardhat().then((hardhat) => hardhat.mine())
        cy.wait('@eth_getTransactionReceipt')

        // Verify transaction
        cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')
        cy.get(getTestSelector('popups')).contains('Swapped')
        const finalBalance = initialBalance + 1
        cy.get('#swap-currency-output').contains(`Balance: ${finalBalance}`)
        getBalance(USDC_MAINNET).should('eq', finalBalance)
      })
    })
    describe('multichain balances', () => {
      it('shows balances for disconnected chains', () => {
        cy.hardhat().then((hardhat) => {
          cy.interceptGraphqlOperation('PortfolioBalancesWeb', 'mini-portfolio/tokens.json').as('PortfolioBalancesWeb')
          cy.visit('/swap', {
            featureFlags: [{ flag: FeatureFlags.MultichainUX, value: true }],
          })

          cy.wait('@PortfolioBalancesWeb')
          cy.get('#swap-currency-input .open-currency-select-button').click()
          cy.get(getTestSelector('chain-selector')).last().click()
          cy.get(getTestSelector('network-button-10')).click()
          const sendSpy = cy.spy(hardhat.provider, 'send')
          cy.wrap(sendSpy).should('not.be.calledWith', 'wallet_switchEthereumChain')
          cy.get(getTestSelector('common-base-ETH')).click()
          cy.get('#swap-currency-input').contains(`Balance: <0.001`)
        })
      })
    })
  })
})
