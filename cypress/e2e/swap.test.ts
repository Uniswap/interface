import { getTestSelector } from '../utils'

const UNI_GOERLI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const WETH_GOERLI = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'

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
    cy.contains(tokenSymbol).click({ force: true })

    cy.get('body')
      .then(($body) => {
        if ($body.find(getTestSelector('TokenSafetyWrapper')).length) {
          return 'I understand'
        }

        return 'no-op' // Don't click on anything, a no-op
      })
      .then((selector) => {
        if (selector !== 'no-op') {
          cy.contains(selector).click()
        }
      })

    // token selector should close...
    cy.contains('Search name or paste address').should('not.exist')
  }

  describe('Swap on main page', () => {
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

      selectToken('WETH', 'output')
      cy.get(getTestSelector('swap-currency-button')).first().click()

      verifyToken('input', 'WETH')
      verifyToken('output', 'ETH')
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

    it('review step for ETH to UNI trade', () => {
      cy.visit('/swap')
      selectToken('UNI', 'output')
      cy.get('#swap-currency-input .token-amount-input').clear().type('0.0000001')
      cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
      cy.get('#swap-button').click()
      cy.get('#confirm-swap-or-send').should('contain', 'Confirm Swap')
      cy.get('[data-cy="confirmation-close-icon"]').click()
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
  })

  describe('Swap on Token Detail Page', () => {
    beforeEach(() => {
      // On mobile widths, we just link back to /swap instead of rendering the swap component.
      cy.viewport(1200, 800)
      cy.visit(`/tokens/goerli/${UNI_GOERLI}`).then(() => {
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
      cy.url().should('include', `${WETH_GOERLI}`)
      cy.url().should('not.include', `${UNI_GOERLI}`)
    })

    it('should not share swap state with the main swap page', () => {
      verifyToken('output', 'UNI')
      selectToken('WETH', 'input')
      cy.visit('/swap')
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
  })
})
