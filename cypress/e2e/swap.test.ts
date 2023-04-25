import { USDC_MAINNET } from '../../src/constants/tokens'
import { WETH_GOERLI } from '../fixtures/constants'
import { HardhatProvider } from '../support/hardhat'
import { getTestSelector } from '../utils'

describe('Swap', () => {
  let hardhat: HardhatProvider
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

  const selectOutput = (tokenSymbol: string) => {
    // open token selector...
    cy.contains('Select token').click()
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

  before(() => {
    cy.visit('/swap', { ethereum: 'hardhat' }).then((window) => {
      hardhat = window.hardhat
    })
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

  it('can swap ETH for USDC', () => {
    const TOKEN_ADDRESS = USDC_MAINNET.address
    const BALANCE_INCREMENT = 1
    cy.then(() => hardhat.utils.getBalance(hardhat.wallet.address, USDC_MAINNET))
      .then((balance) => Number(balance.toFixed(1)))
      .then((initialBalance) => {
        cy.get('#swap-currency-output .open-currency-select-button').click()
        cy.get('[data-testid="token-search-input"]').clear().type(TOKEN_ADDRESS)
        cy.contains('USDC').click()
        cy.get('#swap-currency-output .token-amount-input').clear().type(BALANCE_INCREMENT.toString())
        cy.get('#swap-currency-input .token-amount-input').should('not.equal', '')
        cy.get('#swap-button').click()
        cy.get('#confirm-swap-or-send').click()
        cy.get('[data-testid="dismiss-tx-confirmation"]').click()
        // ui check
        cy.get('#swap-currency-output [data-testid="balance-text"]').should(
          'have.text',
          `Balance: ${initialBalance + BALANCE_INCREMENT}`
        )

        // chain state check
        cy.then(() => hardhat.utils.getBalance(hardhat.wallet.address, USDC_MAINNET))
          .then((balance) => Number(balance.toFixed(1)))
          .should('eq', initialBalance + BALANCE_INCREMENT)
      })
  })

  it('should have the correct default input/output and token selection should work', () => {
    cy.visit('/swap')
    verifyToken('input', 'ETH')
    verifyToken('output', null)

    selectOutput('WETH')
    cy.get(getTestSelector('swap-currency-button')).first().click()

    verifyToken('input', 'WETH')
    verifyToken('output', 'ETH')
  })

  it('should have the correct default input from URL params ', () => {
    cy.visit(`/swap?inputCurrency=${WETH_GOERLI}`)

    verifyToken('input', 'WETH')
    verifyToken('output', null)

    selectOutput('Ether')
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

    selectOutput('Ether')
    cy.get(getTestSelector('swap-currency-button')).first().click()

    verifyToken('input', 'ETH')
    verifyToken('output', 'WETH')
  })

  it('ETH to wETH is same value (wrapped swaps have no price impact)', () => {
    cy.visit('/swap')
    selectOutput('WETH')
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
})
