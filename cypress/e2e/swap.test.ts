import { SupportedChainId, WETH9 } from '@uniswap/sdk-core'

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
    cy.visit('/swap')
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
    cy.visit(`/swap?inputCurrency=${WETH9[SupportedChainId.GOERLI].address}`)

    verifyToken('input', 'WETH')
    verifyToken('output', null)

    selectOutput('Ether')
    cy.get(getTestSelector('swap-currency-button')).first().click()

    verifyToken('input', 'ETH')
    verifyToken('output', 'WETH')
  })

  it('should have the correct default output from URL params ', () => {
    cy.visit(`/swap?outputCurrency=${WETH9[SupportedChainId.GOERLI].address}`)

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
})
