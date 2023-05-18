import { SupportedChainId, WETH9 } from '@uniswap/sdk-core'

import { getTestSelector } from '../../utils'

describe('Swap', () => {
  it('should be able to wrap ETH', () => {
    const BALANCE_INCREMENT = 1
    cy.visit('/swap', { ethereum: 'hardhat' })
      .hardhat()
      .then((hardhat) => {
        cy.then(() => hardhat.getBalance(hardhat.wallet.address, WETH9[SupportedChainId.MAINNET]))
          .then((balance) => Number(balance.toFixed(1)))
          .then((initialWethBalance) => {
            // Select WETH for the token output.
            cy.get('#swap-currency-output .open-currency-select-button').click()
            cy.contains('WETH').click()

            // Enter the amount to wrap.
            cy.get('#swap-currency-output .token-amount-input').clear().type(BALANCE_INCREMENT.toString())
            cy.get('#swap-currency-input .token-amount-input').should('not.equal', '')

            // Click the wrap button.
            cy.get(getTestSelector('wrap-button')).should('not.be.disabled')
            cy.get(getTestSelector('wrap-button')).click()

            // The pending transaction indicator should be visible.
            cy.get(getTestSelector('web3-status-connected')).should('have.descendants', ':contains("1 Pending")')

            // <automine transaction>

            // The pending transaction indicator should be gone.
            cy.get(getTestSelector('web3-status-connected')).should('not.have.descendants', ':contains("1 Pending")')

            // The UI balance should have increased.
            cy.get('#swap-currency-output [data-testid="balance-text"]').should(
              'have.text',
              `Balance: ${initialWethBalance + BALANCE_INCREMENT}`
            )

            // There should be a successful wrap notification.
            cy.contains('Wrapped').should('exist')

            // The user's WETH account balance should have increased
            cy.then(() => hardhat.getBalance(hardhat.wallet.address, WETH9[SupportedChainId.MAINNET]))
              .then((balance) => Number(balance.toFixed(1)))
              .should('eq', initialWethBalance + BALANCE_INCREMENT)
          })
      })
  })

  it('should be able to unwrap WETH', () => {
    const BALANCE_INCREMENT = 1
    cy.visit('/swap', { ethereum: 'hardhat' })
      .hardhat()
      .then((hardhat) => {
        cy.then(() => hardhat.getBalance(hardhat.wallet.address, WETH9[SupportedChainId.MAINNET])).then(
          (initialBalance) => {
            // Select WETH for the token output.
            cy.get('#swap-currency-output .open-currency-select-button').click()
            cy.contains('WETH').click()

            // Enter the amount to wrap.
            cy.get('#swap-currency-output .token-amount-input').clear().type(BALANCE_INCREMENT.toString())
            cy.get('#swap-currency-input .token-amount-input').should('not.equal', '')

            // Click the wrap button.
            cy.get(getTestSelector('wrap-button')).should('not.be.disabled')
            cy.get(getTestSelector('wrap-button')).click()

            // <automine transaction>

            // The pending transaction indicator should be visible.
            cy.contains('1 Pending').should('exist')
            // The user should see a notification telling them they successfully wrapped their ETH.
            cy.contains('Wrapped').should('exist')

            // Switch to unwrapping the ETH we just wrapped.
            cy.get(getTestSelector('swap-currency-button')).click()
            cy.get(getTestSelector('wrap-button')).should('not.be.disabled')

            // Click the Unwrap button.
            cy.get(getTestSelector('wrap-button')).click()

            // The pending transaction indicator should be visible.
            cy.contains('1 Pending').should('exist')

            // <automine transaction>

            // The pending transaction indicator should be gone.
            cy.contains('1 Pending').should('not.exist')
            // The user should see a notification telling them they successfully unwrapped their ETH.
            cy.contains('Unwrapped').should('exist')

            // The UI balance should have decreased.
            cy.get('#swap-currency-input [data-testid="balance-text"]').should(
              'have.text',
              `Balance: ${initialBalance.toFixed(0)}`
            )

            // There should be a successful unwrap notification.
            cy.contains('Unwrapped').should('exist')

            // The user's WETH account balance should not have changed from the initial balance
            cy.then(() => hardhat.getBalance(hardhat.wallet.address, WETH9[SupportedChainId.MAINNET]))
              .then((balance) => balance.toFixed(0))
              .should('eq', initialBalance.toFixed(0))
          }
        )
      })
  })
})
