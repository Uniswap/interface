import { SupportedChainId } from '@uniswap/sdk-core'

import { UNI, USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

const UNI_MAINNET = UNI[SupportedChainId.MAINNET]

describe('Swap', () => {
  describe('Swap on main page', () => {
    beforeEach(() => {
      cy.visit('/swap', { ethereum: 'hardhat' })
    })

    it('starts with ETH selected by default', () => {
      cy.get(`#swap-currency-input .token-amount-input`).should('have.value', '')
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'ETH')
      cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'Select token')
    })

    it('can enter an amount into input', () => {
      cy.get('#swap-currency-input .token-amount-input').clear().type('0.001').should('have.value', '0.001')
    })

    it('zero swap amount', () => {
      cy.get('#swap-currency-input .token-amount-input').clear().type('0.0').should('have.value', '0.0')
    })

    it('invalid swap amount', () => {
      cy.get('#swap-currency-input .token-amount-input').clear().type('\\').should('have.value', '')
    })

    it('can enter an amount into output', () => {
      cy.get('#swap-currency-output .token-amount-input').clear().type('0.001').should('have.value', '0.001')
    })

    it('zero output amount', () => {
      cy.get('#swap-currency-output .token-amount-input').clear().type('0.0').should('have.value', '0.0')
    })

    it('should render an error when a transaction fails due to a passed deadline', () => {
      const DEADLINE_MINUTES = 1
      const TEN_MINUTES_MS = 1000 * 60 * DEADLINE_MINUTES * 10
      cy.hardhat({ automine: false }).then((hardhat) => {
        cy.then(() => hardhat.getBalance(hardhat.wallet.address, USDC_MAINNET))
          .then((balance) => Number(balance.toFixed(1)))
          .then((initialBalance) => {
            // Input swap info.
            cy.get('#swap-currency-output .open-currency-select-button').click()
            cy.contains('USDC').click()
            cy.get('#swap-currency-output .token-amount-input').clear().type('1')
            cy.get('#swap-currency-input .token-amount-input').should('not.equal', '')

            // Set deadline to minimum. (1 minute)
            cy.get(getTestSelector('open-settings-dialog-button')).click()
            cy.get(getTestSelector('transaction-deadline-settings')).click()
            cy.get(getTestSelector('deadline-input')).clear().type(DEADLINE_MINUTES.toString())
            cy.get('body').click('topRight')
            cy.get(getTestSelector('deadline-input')).should('not.exist')

            cy.get('#swap-button').click()
            cy.get('#confirm-swap-or-send').click()

            // Dismiss the modal that appears when a transaction is broadcast to the network.
            cy.get(getTestSelector('dismiss-tx-confirmation')).click()

            // The UI should show the transaction as pending.
            cy.contains('1 Pending').should('exist')

            // Mine a block past the deadline.
            cy.then(() => hardhat.mine(1, TEN_MINUTES_MS)).then(() => {
              // The UI should no longer show the transaction as pending.
              cy.contains('1 Pending').should('not.exist')

              // Check that the user is informed of the failure
              cy.contains('Swap failed').should('exist')

              // Check that the balance is unchanged in the UI
              cy.get('#swap-currency-output [data-testid="balance-text"]').should(
                'have.text',
                `Balance: ${initialBalance}`
              )

              // Check that the balance is unchanged on chain
              cy.then(() => hardhat.getBalance(hardhat.wallet.address, USDC_MAINNET))
                .then((balance) => Number(balance.toFixed(1)))
                .should('eq', initialBalance)
            })
          })
      })
    })

    it('should default inputs from URL params ', () => {
      cy.visit(`/swap?inputCurrency=${UNI_MAINNET.address}`, { ethereum: 'hardhat' })
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'UNI')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'Select token')

      cy.visit(`/swap?outputCurrency=${UNI_MAINNET.address}`, { ethereum: 'hardhat' })
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'Select token')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'UNI')

      cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${UNI_MAINNET.address}`, { ethereum: 'hardhat' })
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'ETH')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'UNI')
    })

    it('ETH to wETH is same value (wrapped swaps have no price impact)', () => {
      cy.get(`#swap-currency-output .open-currency-select-button`).click()
      cy.contains('WETH').click()
      cy.get('#swap-currency-input .token-amount-input').clear().type('0.01')
      cy.get('#swap-currency-output .token-amount-input').should('have.value', '0.01')
    })

    it('Opens and closes the settings menu', () => {
      cy.contains('Settings').should('not.exist')
      cy.get(getTestSelector('open-settings-dialog-button')).click()
      cy.contains('Max slippage').should('exist')
      cy.contains('Transaction deadline').should('exist')
      cy.contains('Auto Router API').should('exist')
      cy.get(getTestSelector('open-settings-dialog-button')).click()
      cy.contains('Settings').should('not.exist')
    })

    it('inputs reset when navigating between pages', () => {
      cy.get('#swap-currency-input .token-amount-input').clear().type('0.01')
      cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
      cy.visit('/pool')
      cy.visit('/swap')
      cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
      cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
    })

    it('can swap ETH for USDC', () => {
      const TOKEN_ADDRESS = USDC_MAINNET.address
      const BALANCE_INCREMENT = 1
      cy.hardhat().then((hardhat) => {
        cy.then(() => hardhat.getBalance(hardhat.wallet.address, USDC_MAINNET))
          .then((balance) => Number(balance.toFixed(1)))
          .then((initialBalance) => {
            cy.get('#swap-currency-output .open-currency-select-button').click()
            cy.get(getTestSelector('token-search-input')).clear().type(TOKEN_ADDRESS)
            cy.contains('USDC').click()
            cy.get('#swap-currency-output .token-amount-input').clear().type(BALANCE_INCREMENT.toString())
            cy.get('#swap-currency-input .token-amount-input').should('not.equal', '')
            cy.get('#swap-button').click()
            cy.get('#confirm-swap-or-send').click()
            cy.get(getTestSelector('dismiss-tx-confirmation')).click()

            // ui check
            cy.get('#swap-currency-output [data-testid="balance-text"]').should(
              'have.text',
              `Balance: ${initialBalance + BALANCE_INCREMENT}`
            )

            // chain state check
            cy.then(() => hardhat.getBalance(hardhat.wallet.address, USDC_MAINNET))
              .then((balance) => Number(balance.toFixed(1)))
              .should('eq', initialBalance + BALANCE_INCREMENT)
          })
      })
    })
  })
})
