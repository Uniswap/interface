import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'

import { USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

describe('Swap', () => {
  it('should render and dismiss the wallet rejection modal', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })
      .hardhat()
      .then((hardhat) => {
        cy.stub(hardhat.wallet, 'sendTransaction').log(false).rejects(new Error('user cancelled'))

        cy.get('#swap-currency-output .open-currency-select-button').click()
        cy.get(getTestSelector('token-search-input')).clear().type(USDC_MAINNET.address)
        cy.contains('USDC').click()
        cy.get('#swap-currency-output .token-amount-input').clear().type('1')
        cy.get('#swap-currency-input .token-amount-input').should('not.equal', '')
        cy.get('#swap-button').click()
        cy.get('#confirm-swap-or-send').click()
        cy.contains('Transaction rejected').should('exist')
        cy.contains('Dismiss').click()
        cy.contains('Transaction rejected').should('not.exist')
      })
  })

  it.skip('should render an error for slippage failure', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })
      .hardhat({ automine: false })
      .then((hardhat) => {
        cy.then(() => hardhat.provider.getBalance(hardhat.wallet.address)).then((initialBalance) => {
          // Gas estimation fails for this transaction (that would normally fail), so we stub it.
          const send = cy.stub(hardhat.provider, 'send').log(false)
          send.withArgs('eth_estimateGas').resolves(BigNumber.from(2_000_000))
          send.callThrough()

          // Set slippage to a very low value.
          cy.get(getTestSelector('open-settings-dialog-button')).click()
          cy.get(getTestSelector('max-slippage-settings')).click()
          cy.get(getTestSelector('slippage-input')).clear().type('0.01')
          cy.get('body').click('topRight')
          cy.get(getTestSelector('slippage-input')).should('not.exist')

          // Open the currency select modal.
          cy.get('#swap-currency-output .open-currency-select-button').click()

          // Select UNI as output token
          cy.get(getTestSelector('token-search-input')).clear().type('Uniswap')
          cy.get(getTestSelector('currency-list-wrapper'))
            .contains(/^Uniswap$/)
            .first()
            // Our scrolling library (react-window) seems to freeze when acted on by cypress, with this element set to
            // `pointer-events: none`. This can be ignored using `{force: true}`.
            .click({ force: true })

          // Swap 2 times.
          const AMOUNT_TO_SWAP = 400
          const NUMBER_OF_SWAPS = 2
          const INDIVIDUAL_SWAP_INPUT = AMOUNT_TO_SWAP / NUMBER_OF_SWAPS
          cy.get('#swap-currency-input .token-amount-input').clear().type(INDIVIDUAL_SWAP_INPUT.toString())
          cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
          cy.get('#swap-button').click()
          cy.get('#confirm-swap-or-send').click()
          cy.get(getTestSelector('dismiss-tx-confirmation')).click()
          cy.get('#swap-currency-input .token-amount-input').clear().type(INDIVIDUAL_SWAP_INPUT.toString())
          cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
          cy.get('#swap-button').click()
          cy.get('#confirm-swap-or-send').click()
          cy.get(getTestSelector('dismiss-tx-confirmation')).click()

          // The pending transaction indicator should be visible.
          cy.contains('Pending').should('exist')

          cy.then(() => hardhat.mine()).then(() => {
            // The pending transaction indicator should not be visible.
            cy.contains('Pending').should('not.exist')

            // Check for a failed transaction notification.
            cy.contains('Swap failed').should('exist')

            // Assert that at least one of the swaps failed due to slippage.
            cy.then(() => hardhat.provider.getBalance(hardhat.wallet.address)).then((finalBalance) => {
              expect(finalBalance.gt(initialBalance.sub(parseEther(AMOUNT_TO_SWAP.toString())))).to.be.true
            })
          })
        })
      })
  })
})
