import { getTestSelector, resetHardhatChain } from '../utils'

describe('Add Liquidity', () => {
  it('loads the token pair', () => {
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/ETH/500')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'ETH')
    cy.contains('0.05% fee tier')
  })

  describe('chain changes', () => {
    afterEach(resetHardhatChain)

    it('clears the token selection when chain changes', () => {
      cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/ETH/500')
      cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
      cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'ETH')
      cy.get(getTestSelector('chain-selector')).last().click()
      cy.contains('Polygon').click()
      cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'MATIC')
      cy.get('#add-liquidity-input-tokena .token-symbol-container').should('not.contain.text', 'UNI')
    })
  })

  it('does not crash if token is duplicated', () => {
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('not.contain.text', 'UNI')
  })

  it('single token can be selected', () => {
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
  })

  it('loads fee tier distribution', () => {
    cy.interceptGraphqlOperation('FeeTierDistribution', 'feeTierDistribution.json')

    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/ETH')
    cy.get('#add-liquidity-selected-fee .selected-fee-label').should('contain.text', '0.30% fee tier')
    cy.get('#add-liquidity-selected-fee .selected-fee-percentage').should('contain.text', '77% select')
  })

  it('disables increment and decrement until initial prices are inputted', () => {
    // ETH / BITCOIN pool (0.05% tier not created)
    cy.visit('/add/ETH/0x72e4f9F808C49A2a61dE9C5896298920Dc4EEEa9/500')
    // Set starting price in order to enable price range step counters
    cy.get('.start-price-input').type('1000')

    // Min Price increment / decrement buttons should be disabled
    cy.get(getTestSelector('increment-price-range')).eq(0).should('be.disabled')
    cy.get(getTestSelector('decrement-price-range')).eq(0).should('be.disabled')
    // Enter min price, which should enable the buttons
    cy.get('.rate-input-0').eq(0).type('900').blur()
    cy.get(getTestSelector('increment-price-range')).eq(0).should('not.be.disabled')
    cy.get(getTestSelector('decrement-price-range')).eq(0).should('not.be.disabled')

    // Repeat for Max Price step counter
    cy.get(getTestSelector('increment-price-range')).eq(1).should('be.disabled')
    cy.get(getTestSelector('decrement-price-range')).eq(1).should('be.disabled')
    // Enter max price, which should enable the buttons
    cy.get('.rate-input-0').eq(1).type('1100').blur()
    cy.get(getTestSelector('increment-price-range')).eq(1).should('not.be.disabled')
    cy.get(getTestSelector('decrement-price-range')).eq(1).should('not.be.disabled')
  })

  it('allows full range selection on new pool creation', () => {
    // ETH / BITCOIN pool (0.05% tier not created)
    cy.visit('/add/ETH/0x72e4f9F808C49A2a61dE9C5896298920Dc4EEEa9/500')
    // Set starting price in order to enable price range step counters
    cy.get('.start-price-input').type('1000')
    cy.get('[data-testid="set-full-range"]').click()
    // Check that the min price is 0 and the max price is infinity
    cy.get('.rate-input-0').eq(0).should('have.value', '0')
    cy.get('.rate-input-0').eq(1).should('have.value', '∞')
    // Increment and decrement buttons are disabled when full range is selected
    cy.get('[data-testid="increment-price-range"]').eq(0).should('be.disabled')
    cy.get('[data-testid="decrement-price-range"]').eq(0).should('be.disabled')
    cy.get('[data-testid="increment-price-range"]').eq(1).should('be.disabled')
    cy.get('[data-testid="decrement-price-range"]').eq(1).should('be.disabled')
    // Check that url params were added
    cy.url().then((url) => {
      const params = new URLSearchParams(url)
      const minPrice = params.get('minPrice')
      const maxPrice = params.get('maxPrice')
      // Note: although 0 and ∞ displayed, actual values in query are ticks at limit
      return minPrice && maxPrice && parseFloat(minPrice) < parseFloat(maxPrice)
    })
  })
})
