import { ChainId, CurrencyAmount, WETH9 } from '@uniswap/sdk-core'

import { getBalance, getTestSelector } from '../../utils'

const WETH = WETH9[ChainId.MAINNET]

describe('Swap wrap', () => {
  beforeEach(() => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${WETH.address}`).hardhat({ automine: false })
  })

  it('ETH to wETH is same value (wrapped swaps have no price impact)', () => {
    cy.get('#swap-currency-input .token-amount-input').type('0.01').should('have.value', '0.01')
    cy.get('#swap-currency-output .token-amount-input').should('have.value', '0.01')

    cy.get('#swap-currency-output .token-amount-input').clear().type('0.02').should('have.value', '0.02')
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '0.02')
  })

  it('should be able to wrap ETH', () => {
    getBalance(WETH).then((initialBalance) => {
      cy.contains('Enter ETH amount')

      // Enter amount to wrap
      cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', 1)
      cy.get('#swap-currency-input .token-amount-input').should('have.value', 1)

      // Submit transaction
      cy.contains('Wrap').click()
      cy.wait('@eth_estimateGas').wait('@eth_sendRawTransaction').wait('@eth_getTransactionReceipt')
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')

      // Mine transaction
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.wait('@eth_getTransactionReceipt')

      // Verify transaction
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')
      cy.get(getTestSelector('popups')).contains('Wrapped')
      const finalBalance = initialBalance + 1
      cy.get('#swap-currency-output').contains(`Balance: ${finalBalance}`)
      getBalance(WETH).should('equal', finalBalance)
    })
  })

  it('should be able to unwrap WETH', () => {
    cy.hardhat().then(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(WETH, 1e18))
      await hardhat.mine()
    })

    getBalance(WETH).then((initialBalance) => {
      // Swap input/output to unwrap WETH
      cy.get(getTestSelector('swap-currency-button')).click()
      cy.contains('Enter WETH amount')

      // Enter the amount to unwrap
      cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', 1)
      cy.get('#swap-currency-input .token-amount-input').should('have.value', 1)

      // Submit transaction
      cy.contains('Unwrap').click()
      cy.wait('@eth_estimateGas').wait('@eth_sendRawTransaction').wait('@eth_getTransactionReceipt')
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')

      // Mine transaction
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.wait('@eth_getTransactionReceipt')

      // Verify transaction
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')
      cy.get(getTestSelector('popups')).contains('Unwrapped')
      const finalBalance = initialBalance - 1
      cy.get('#swap-currency-input').contains(`Balance: ${finalBalance}`)
      getBalance(WETH).should('equal', finalBalance)
    })
  })
})
