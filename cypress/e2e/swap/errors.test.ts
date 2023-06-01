import { BigNumber } from '@ethersproject/bignumber'
import { SupportedChainId } from '@uniswap/sdk-core'

import { UNI, USDC_MAINNET } from '../../../src/constants/tokens'
import { getBalance, getTestSelector } from '../../utils'

const UNI_MAINNET = UNI[SupportedChainId.MAINNET]

describe('Swap errors', () => {
  it('wallet rejection', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`, { ethereum: 'hardhat' })
    cy.hardhat().then((hardhat) => {
      // Stub the wallet to reject any transaction.
      cy.stub(hardhat.wallet, 'sendTransaction').log(false).rejects(new Error('user cancelled'))

      // Attempt to swap.
      cy.get('#swap-currency-output .token-amount-input').clear().type('1').should('have.value', '1')
      cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')
      cy.get('#swap-button').click()
      cy.get('#confirm-swap-or-send').click()

      cy.contains('Review swap').should('exist')
      cy.get('body').click('topRight')
      cy.contains('Review swap').should('not.exist')
    })
  })

  it('transaction past deadline', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`, { ethereum: 'hardhat' })
    cy.hardhat({ automine: false })
    getBalance(USDC_MAINNET).then((initialBalance) => {
      // Set deadline to minimum. (1 minute)
      cy.get(getTestSelector('open-settings-dialog-button')).click()
      cy.get(getTestSelector('transaction-deadline-settings')).click()
      cy.get(getTestSelector('deadline-input')).clear().type('1') // 1 minute

      // Click outside of modal to dismiss it.
      cy.get('body').click('topRight')
      cy.get(getTestSelector('deadline-input')).should('not.exist')

      // Attempt to swap.
      cy.get('#swap-currency-output .token-amount-input').clear().type('1').should('have.value', '1')
      cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')
      cy.get('#swap-button').click()
      cy.get('#confirm-swap-or-send').click()
      cy.get(getTestSelector('confirmation-close-icon')).click()

      // The pending transaction indicator should reflect the state.
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
      cy.hardhat().then((hardhat) => hardhat.mine(1, /* 10 minutes */ 1000 * 60 * 10)) // mines past the deadline
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

      // TODO(WEB-2085): Fix this test - transaction popups are flakey.
      // cy.get(getTestSelector('transaction-popup')).contains('Swap failed')

      // Verify the balance is unchanged.
      cy.get('#swap-currency-output [data-testid="balance-text"]').should('have.text', `Balance: ${initialBalance}`)
      getBalance(USDC_MAINNET).should('eq', initialBalance)
    })
  })

  it('slippage failure', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${UNI_MAINNET.address}`, { ethereum: 'hardhat' })
    cy.hardhat({ automine: false })
    getBalance(USDC_MAINNET).then((initialBalance) => {
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

      // Click outside of modal to dismiss it.
      cy.get('body').click('topRight')
      cy.get(getTestSelector('slippage-input')).should('not.exist')

      // Swap 2 times.
      const AMOUNT_TO_SWAP = 200
      cy.get('#swap-currency-input .token-amount-input')
        .clear()
        .type(AMOUNT_TO_SWAP.toString())
        .should('have.value', AMOUNT_TO_SWAP.toString())
      cy.get('#swap-currency-output .token-amount-input').should('not.have.value', '')
      cy.get('#swap-button').click()
      cy.get('#confirm-swap-or-send').click()
      cy.contains('Confirm Swap').should('exist')
      cy.get(getTestSelector('confirmation-close-icon')).click()

      cy.get('#swap-currency-input .token-amount-input')
        .clear()
        .type(AMOUNT_TO_SWAP.toString())
        .should('have.value', AMOUNT_TO_SWAP.toString())
      cy.get('#swap-currency-output .token-amount-input').should('not.have.value', '')
      cy.get('#swap-button').click()
      cy.get('#confirm-swap-or-send').click()
      cy.contains('Confirm Swap').should('exist')
      cy.get(getTestSelector('confirmation-close-icon')).click()

      // The pending transaction indicator should reflect the state.
      cy.get(getTestSelector('web3-status-connected')).should('contain', '2 Pending')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

      // TODO(WEB-2085): Fix this test - transaction popups are flakey.
      // cy.get(getTestSelector('transaction-popup')).contains('Swap failed')

      // Assert that the transactions were unsuccessful by checking on-chain balance.
      getBalance(UNI_MAINNET).should('equal', initialBalance)
    })
  })
})
