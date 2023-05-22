import { CurrencyAmount, SupportedChainId, WETH9 } from '@uniswap/sdk-core'

import { getBalance, getTestSelector } from '../../utils'

const WETH = WETH9[SupportedChainId.MAINNET]

describe('Swap wrap', () => {
  beforeEach(() => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${WETH.address}`, { ethereum: 'hardhat' }).hardhat({
      automine: false,
    })
  })

  it('ETH to wETH is same value (wrapped swaps have no price impact)', () => {
    cy.get('#swap-currency-input .token-amount-input').clear().type('0.01').should('have.value', '0.01')
    cy.get('#swap-currency-output .token-amount-input').should('have.value', '0.01')

    cy.get('#swap-currency-output .token-amount-input').clear().type('0.02').should('have.value', '0.02')
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '0.02')
  })

  it('should be able to wrap ETH', () => {
    getBalance(WETH).then((initialWethBalance) => {
      cy.contains('Enter ETH amount')

      // Enter the amount to wrap.
      cy.get('#swap-currency-output .token-amount-input').click().type('1').should('have.value', 1)
      // This also ensures we don't click "Wrap" before the UI has caught up.
      cy.get('#swap-currency-input .token-amount-input').should('have.value', 1)

      // Click the wrap button.
      cy.contains('Wrap').click()

      // The pending transaction indicator should reflect the state.
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

      // TODO(WEB-2085): Fix this test - transaction popups are flakey.
      // cy.get(getTestSelector('transaction-popup')).contains('Wrapped')
      // cy.get(getTestSelector('transaction-popup')).contains('1.00 ETH for 1.00 WETH')

      // The UI balance should have increased.
      cy.get('#swap-currency-output').should('contain', `Balance: ${initialWethBalance + 1}`)

      // The user's WETH account balance should have increased
      getBalance(WETH).should('equal', initialWethBalance + 1)
    })
  })

  it('should be able to unwrap WETH', () => {
    cy.hardhat().then(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(WETH, 1e18))
      await hardhat.mine()
    })

    getBalance(WETH).then((initialWethBalance) => {
      // Swap input/output to unwrap WETH.
      cy.get(getTestSelector('swap-currency-button')).click()
      cy.contains('Enter WETH amount')

      // Enter the amount to unwrap.
      cy.get('#swap-currency-output .token-amount-input').click().type('1').should('have.value', 1)
      // This also ensures we don't click "Wrap" before the UI has caught up.
      cy.get('#swap-currency-input .token-amount-input').should('have.value', 1)

      // Click the unwrap button.
      cy.contains('Unwrap').click()

      // The pending transaction indicator should reflect the state.
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

      // TODO(WEB-2085): Fix this test - transaction popups are flakey.
      // cy.get(getTestSelector('transaction-popup')).contains('Unwrapped')
      // cy.get(getTestSelector('transaction-popup')).contains('1.00 WETH for 1.00 ETH')

      // The UI balance should have increased.
      cy.get('#swap-currency-input').should('contain', `Balance: ${initialWethBalance - 1}`)

      // The user's WETH account balance should have increased
      getBalance(WETH).should('equal', initialWethBalance - 1)
    })
  })
})
