import { SupportedChainId } from '@uniswap/sdk-core'

import { UNI, USDC_MAINNET } from '../../../src/constants/tokens'
import { getBalance, getTestSelector } from '../../utils'

const UNI_MAINNET = UNI[SupportedChainId.MAINNET]

describe('Swap', () => {
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

    it('swaps ETH for USDC', () => {
      cy.visit('/swap', { ethereum: 'hardhat' })
      cy.hardhat({ automine: false })
      getBalance(USDC_MAINNET).then((initialBalance) => {
        cy.get('#swap-currency-output .open-currency-select-button').click()
        cy.get(getTestSelector('token-search-input')).clear().type(USDC_MAINNET.address)
        cy.contains('USDC').click()
        cy.get('#swap-currency-output .token-amount-input').clear().type('1').should('have.value', '1')
        cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')
        cy.get('#swap-button').click()
        cy.get('#confirm-swap-or-send').click()
        cy.get(getTestSelector('confirmation-close-icon')).click()

        // The pending transaction indicator should reflect the state.
        cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
        cy.hardhat().then((hardhat) => hardhat.mine())
        cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

        // TODO(WEB-2085): Fix this test - transaction popups are flakey.
        // cy.get(getTestSelector('transaction-popup')).contains('Swapped')

        // Verify the balance is updated.
        cy.get('#swap-currency-output [data-testid="balance-text"]').should(
          'have.text',
          `Balance: ${initialBalance + 1}`
        )
        getBalance(USDC_MAINNET).should('eq', initialBalance + 1)
      })
    })
  })
})
