import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { SupportedChainId, WETH9 } from '@uniswap/sdk-core'

import { UNI as UNI_MAINNET, USDC_MAINNET } from '../../src/constants/tokens'
import { FeatureFlag } from '../../src/featureFlags/flags/featureFlags'
import { WETH_GOERLI } from '../fixtures/constants'
import { getTestSelector } from '../utils'

describe('Swap', () => {
  const verifyAmount = (field: 'input' | 'output', amountText: string | null) => {
    if (amountText === null) {
      cy.get(`#swap-currency-${field} .token-amount-input`).should('not.have.value')
    } else {
      cy.get(`#swap-currency-${field} .token-amount-input`).should('have.value', amountText)
    }
  }

  const verifyToken = (field: 'input' | 'output', tokenSymbol: string | null) => {
    if (tokenSymbol === null) {
      cy.get(`#swap-currency-${field} .token-symbol-container`).should('contain.text', 'Select token')
    } else {
      cy.get(`#swap-currency-${field} .token-symbol-container`).should('contain.text', tokenSymbol)
    }
  }

  const selectToken = (tokenSymbol: string, field: 'input' | 'output') => {
    // open token selector...
    cy.get(`#swap-currency-${field} .open-currency-select-button`).click()
    // select token...
    cy.contains(tokenSymbol).click()

    cy.get('body')
      .then(($body) => {
        if ($body.find(getTestSelector('TokenSafetyWrapper')).length) {
          return 'I understand'
        }

        return 'no-op' // Don't click on anything, a no-op
      })
      .then((content) => {
        if (content !== 'no-op') {
          cy.contains(content).click()
        }
      })

    // token selector should close...
    cy.contains('Search name or paste address').should('not.exist')
  }

  describe('Swap on main page', () => {
    before(() => {
      cy.visit('/swap', { ethereum: 'hardhat' })
    })

    it('starts with ETH selected by default', () => {
      verifyAmount('input', '')
      verifyToken('input', 'ETH')
      verifyAmount('output', null)
      verifyToken('output', null)
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
      cy.visit('/swap', { ethereum: 'hardhat' })
        .hardhat({ automine: false })
        .then((hardhat) => {
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

    it('should have the correct default input from URL params ', () => {
      cy.visit(`/swap?inputCurrency=${WETH_GOERLI}`)

      verifyToken('input', 'WETH')
      verifyToken('output', null)

      selectToken('Ether', 'output')
      cy.get(getTestSelector('swap-currency-button')).first().click()

      verifyToken('input', 'ETH')
      verifyToken('output', 'WETH')
    })

    it('should have the correct default output from URL params ', () => {
      cy.visit(`/swap?outputCurrency=${WETH_GOERLI}`)

      verifyToken('input', null)
      verifyToken('output', 'WETH')

      cy.get(getTestSelector('swap-currency-button')).first().click()
      verifyToken('input', 'WETH')
      verifyToken('output', null)

      selectToken('Ether', 'output')
      cy.get(getTestSelector('swap-currency-button')).first().click()

      verifyToken('input', 'ETH')
      verifyToken('output', 'WETH')
    })

    it('ETH to wETH is same value (wrapped swaps have no price impact)', () => {
      cy.visit('/swap')
      selectToken('WETH', 'output')
      cy.get('#swap-currency-input .token-amount-input').clear().type('0.01')
      cy.get('#swap-currency-output .token-amount-input').should('have.value', '0.01')
    })

    it('Opens and closes the settings menu', () => {
      cy.visit('/swap')
      cy.contains('Settings').should('not.exist')
      cy.get(getTestSelector('swap-settings-button')).click()
      cy.contains('Slippage tolerance').should('exist')
      cy.contains('Transaction deadline').should('exist')
      cy.contains('Auto Router API').should('exist')
      cy.contains('Expert Mode').should('exist')
      cy.get(getTestSelector('swap-settings-button')).click()
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
      cy.visit('/swap', { ethereum: 'hardhat' })
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

  it('should render and dismiss the wallet rejection modal', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })
      .hardhat()
      .then((hardhat) => {
        cy.stub(hardhat.wallet, 'sendTransaction').rejects(new Error('user cancelled'))

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
  describe('Swap on Token Detail Page', () => {
    beforeEach(() => {
      // On mobile widths, we just link back to /swap instead of rendering the swap component.
      cy.viewport(1200, 800)
      cy.visit(`/tokens/ethereum/${UNI_MAINNET[1].address}`, {
        ethereum: 'hardhat',
        featureFlags: [FeatureFlag.removeWidget],
      }).then(() => {
        cy.wait('@eth_blockNumber')
        cy.scrollTo('top')
      })
    })

    it('should have the expected output for a tokens detail page', () => {
      verifyAmount('input', '')
      verifyToken('input', null)
      verifyAmount('output', null)
      verifyToken('output', 'UNI')
    })

    it('should automatically navigate to the new TDP', () => {
      selectToken('WETH', 'output')
      cy.url().should('include', `${WETH9[1].address}`)
      cy.url().should('not.include', `${UNI_MAINNET[1].address}`)
    })

    it('should not share swap state with the main swap page', () => {
      verifyToken('output', 'UNI')
      selectToken('WETH', 'input')
      cy.visit('/swap', { featureFlags: [FeatureFlag.removeWidget] })
      cy.contains('UNI').should('not.exist')
      cy.contains('WETH').should('not.exist')
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

    it('should show a L2 token even if the user is connected to a different network', () => {
      cy.visit('/tokens', { ethereum: 'hardhat', featureFlags: [FeatureFlag.removeWidget] })
      cy.get(getTestSelector('tokens-network-filter-selected')).click()
      cy.get(getTestSelector('tokens-network-filter-option-arbitrum')).click()
      cy.get(getTestSelector('tokens-network-filter-selected')).should('contain', 'Arbitrum')
      cy.get(getTestSelector('token-table-row-ARB')).click()
      verifyToken('output', 'ARB')
      cy.contains('Connect to Arbitrum').should('exist')
    })
  })

  it('should render an error for slippage failure', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })
      .hardhat({ automine: false })
      .then((hardhat) => {
        cy.then(() => hardhat.provider.getBalance(hardhat.wallet.address)).then((initialBalance) => {
          // Gas estimation fails for this transaction (that would normally fail), so we stub it.
          const send = cy.stub(hardhat.provider, 'send')
          send.withArgs('eth_estimateGas').resolves(BigNumber.from(2_000_000))
          send.callThrough()

          // Set slippage to a very low value.
          cy.get(getTestSelector('open-settings-dialog-button')).click()
          cy.get(getTestSelector('slippage-input')).clear().type('0.01')
          cy.get('body').click('topRight')
          cy.get(getTestSelector('slippage-input')).should('not.exist')

          // Open the currency select modal.
          cy.get('#swap-currency-output .open-currency-select-button').click()

          // Wait for the currency list to load
          cy.contains('1inch').should('exist')

          // Select UNI as output token
          cy.get(getTestSelector('token-search-input')).clear().type('Uniswap')
          cy.get(getTestSelector('currency-list-wrapper'))
            .contains(/^Uniswap$/)
            .first()
            .should('exist')
            .click()

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
