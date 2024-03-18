import { BigNumber } from '@ethersproject/bignumber'
import { InterfaceSectionName } from '@uniswap/analytics-events'
import { CurrencyAmount } from '@uniswap/sdk-core'

import { DEFAULT_DEADLINE_FROM_NOW } from '../../../src/constants/misc'
import { DAI, USDC_MAINNET } from '../../../src/constants/tokens'
import { getBalance, getTestSelector } from '../../utils'

describe('Swap errors', () => {
  it('wallet rejection', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)
    cy.hardhat().then((hardhat) => {
      // Stub the wallet to reject any transaction.
      cy.stub(hardhat.wallet, 'sendTransaction').log(false).rejects(new Error('user cancelled'))

      // Enter amount to swap
      cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
      cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

      // Submit transaction
      cy.get('#swap-button').click()
      cy.contains('Confirm swap').click()
      cy.wait('@eth_estimateGas')

      // Verify rejection
      cy.contains('Review swap')
      cy.contains('Confirm swap')
    })
  })

  it('transaction past deadline', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)
    cy.hardhat({ automine: false })
    getBalance(USDC_MAINNET).then((initialBalance) => {
      // Enter amount to swap
      cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
      cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

      // Submit transaction
      cy.get('#swap-button').click()
      cy.contains('Confirm swap').click()
      cy.wait('@eth_estimateGas').wait('@eth_sendRawTransaction').wait('@eth_getTransactionReceipt')
      cy.contains('Swap submitted')
      cy.get(getTestSelector('confirmation-close-icon')).click()
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')

      // Mine transaction
      cy.hardhat().then(async (hardhat) => {
        // Remove the transaction from the mempool, so that it doesn't fail but it is past the deadline.
        // This should result in it being removed from pending transactions, without a failure notificiation.
        const transactions = await hardhat.send('eth_pendingTransactions', [])
        await hardhat.send('hardhat_dropTransaction', [transactions[0].hash])
        // Mine past the deadline
        await hardhat.mine(1, DEFAULT_DEADLINE_FROM_NOW + 1)
      })
      cy.wait('@eth_getTransactionReceipt')

      // Verify transaction did not occur
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')
      cy.get(getTestSelector('popups')).should('not.contain', 'Swap failed')
      cy.get('#swap-currency-output').contains(`Balance: ${initialBalance}`)
      getBalance(USDC_MAINNET).should('eq', initialBalance)
    })
  })

  it('slippage failure', () => {
    cy.visit(`/swap?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`)
    cy.hardhat({ automine: false }).then(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(USDC_MAINNET, 500e6))
      await hardhat.mine()
      await Promise.all([
        hardhat.approval.setTokenAllowanceForPermit2({ owner: hardhat.wallet, token: USDC_MAINNET }),
        hardhat.approval.setPermit2Allowance({ owner: hardhat.wallet, token: USDC_MAINNET }),
      ])
      await hardhat.mine()
    })

    getBalance(DAI).then((initialBalance) => {
      // Gas estimation fails for this transaction (that would normally fail), so we stub it.
      cy.hardhat().then((hardhat) => {
        const send = cy.stub(hardhat.provider, 'send').log(false)
        send.withArgs('eth_estimateGas').resolves(BigNumber.from(2_000_000))
        send.callThrough()
      })
      // Set slippage to a very low value.
      cy.get(getTestSelector('open-settings-dialog-button')).click()
      cy.get(getTestSelector('max-slippage-settings')).click()
      cy.get(getTestSelector('slippage-input')).clear().type('0.01')
      cy.get(getTestSelector('toggle-uniswap-x-button')).click() // turn off uniswapx
      cy.get('body').click('topRight') // close modal
      cy.get(getTestSelector('slippage-input')).should('not.exist')
      // Submit 2 transactions
      for (let i = 0; i < 2; i++) {
        cy.get('#swap-currency-input .token-amount-input').type('200').should('have.value', '200')
        cy.get('#swap-currency-output .token-amount-input').should('not.have.value', '')
        cy.get('#swap-button').click()
        cy.contains(i === 0 ? 'Sign and swap' : 'Confirm swap').click()
        cy.wait('@eth_sendRawTransaction').wait('@eth_getTransactionReceipt')
        cy.contains(i === 0 ? 'Swap pending...' : 'Swap submitted')
        if (i === 0) {
          cy.get(getTestSelector('confirmation-close-icon')).click()
        }
      }
      cy.get(getTestSelector('web3-status-connected')).should('contain', '2 Pending')

      // Mine transactions
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.wait('@eth_getTransactionReceipt')

      // Verify only 1 transaction occurred
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')
      getBalance(DAI).should('be.closeTo', initialBalance + 200, 1)
    })
  })

  it('insufficient liquidity', () => {
    // The API response is too variable so stubbing a 404.
    cy.intercept('POST', 'https://interface.gateway.uniswap.org/v2/quote', {
      statusCode: 404,
      fixture: 'insufficientLiquidity.json',
    })

    cy.visit(`/swap?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`)
    cy.get('#swap-currency-output .token-amount-input').type('100000000000000').should('have.value', '100000000000000') // 100 trillion
    cy.contains('Insufficient liquidity for this trade.')
    cy.get('#swap-button').should('not.exist')
    cy.get(getTestSelector(`fiat-value-${InterfaceSectionName.CURRENCY_OUTPUT_PANEL}`)).contains('-')
  })
})
