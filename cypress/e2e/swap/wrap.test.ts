import { CurrencyAmount, SupportedChainId, WETH9 } from '@uniswap/sdk-core'

import { getTestSelector } from '../../utils'

const WETH = WETH9[SupportedChainId.MAINNET]

function getWethBalance() {
  return cy
    .hardhat()
    .then((hardhat) => hardhat.getBalance(hardhat.wallet, WETH))
    .then((balance) => Number(balance.toFixed(1)))
}

describe('Swap', () => {
  beforeEach(() => {
    cy.visit('/swap', { ethereum: 'hardhat' }).hardhat({ automine: false })
  })

  it('should be able to wrap ETH', () => {
    getWethBalance().then((initialWethBalance) => {
      // Select WETH for the token output.
      cy.get('#swap-currency-output').contains('Select token').click()
      cy.contains('WETH').click()
      cy.contains('Enter ETH amount')

      // Enter the amount to wrap.
      cy.get('#swap-currency-output .token-amount-input').click().type('1')
      cy.get('#swap-currency-input .token-amount-input').should('have.value', 1)

      // Click the wrap button.
      cy.contains('Wrap').click()

      // The pending transaction indicator should reflect the state.
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

      // There should be a successful wrap notification.
      cy.get(getTestSelector('transaction-popup')).contains('Wrapped')
      cy.get(getTestSelector('transaction-popup')).contains('1.00 ETH for 1.00 WETH')

      // The UI balance should have increased.
      cy.get('#swap-currency-output').should('contain', `Balance: ${initialWethBalance + 1}`)

      // The user's WETH account balance should have increased
      getWethBalance().should('equal', initialWethBalance + 1)
    })
  })

  it('should be able to unwrap WETH', () => {
    cy.hardhat().then(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(WETH, 1e18))
      await hardhat.mine()
    })

    getWethBalance().then((initialWethBalance) => {
      // Select WETH for the token output.
      cy.get('#swap-currency-output').contains('Select token').click()
      cy.contains('WETH').click()

      // Swap input/output to unwrap WETH.
      cy.get(getTestSelector('swap-currency-button')).click()
      cy.contains('Enter WETH amount')

      // Enter the amount to unwrap.
      cy.get('#swap-currency-output .token-amount-input').click().type('1')
      cy.get('#swap-currency-input .token-amount-input').should('have.value', 1)

      // Click the unwrap button.
      cy.contains('Unwrap').click()

      // The pending transaction indicator should reflect the state.
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

      // There should be a successful wrap notification.
      cy.get(getTestSelector('transaction-popup')).contains('Unwrapped')
      cy.get(getTestSelector('transaction-popup')).contains('1.00 WETH for 1.00 ETH')

      // The UI balance should have increased.
      cy.get('#swap-currency-input').should('contain', `Balance: ${initialWethBalance - 1}`)

      // The user's WETH account balance should have increased
      getWethBalance().should('equal', initialWethBalance - 1)
    })
  })
})
