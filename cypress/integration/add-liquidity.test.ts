describe('Add Liquidity', () => {
  it('loads the two correct tokens', () => {
    cy.visit('/add/0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85/0xc778417E063141139Fce010982780140Aa0cD5Ab/500')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'MKR')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'ETH')
  })

  it('does not crash if ETH is duplicated', () => {
    cy.visit('/add/0xc778417E063141139Fce010982780140Aa0cD5Ab/0xc778417E063141139Fce010982780140Aa0cD5Ab')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'ETH')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('not.contain.text', 'ETH')
  })

  it('token not in storage is loaded', () => {
    cy.visit('/add/0xb290b2f9f8f108d03ff2af3ac5c8de6de31cdf6d/0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'SKL')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'MKR')
  })

  it('single token can be selected', () => {
    cy.visit('/add/0xb290b2f9f8f108d03ff2af3ac5c8de6de31cdf6d')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'SKL')
    cy.visit('/add/0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'MKR')
  })

  describe('with subgraph', () => {
    const TEST_HEADER = 'x-test'
    const FEE_TIER_DISTRIBUTION = 'feeTierDistribution'
    const ALL_V3_TICKS = 'allV3Ticks'

    beforeEach(() => {
      cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req) => {
        if (/feeTierDistribution/.test(req.body.query)) {
          req.alias = 'queryFeeTierDistribution'
          req.reply({ fixture: 'subgraph/feeTierDistribution.json' })
        } else if (/allV3Ticks/.test(req.body.query)) {
          req.alias = 'queryAllV3Ticks'
          req.reply({ fixture: 'subgraph/allV3Ticks.json' })
        }
      })
    })

    it('loads fee tier distribution', () => {
      cy.visit('/add/0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85/0xc778417E063141139Fce010982780140Aa0cD5Ab')

      cy.wait('@queryFeeTierDistribution')

      cy.get('[data-test-id=selected-fee-label]').should('contain.text', '0.3% fee tier')
      cy.get('[data-test-id=selected-fee-percentage]').should('contain.text', '70%')
    })

    it('loads ticks data', () => {
      cy.visit('/add/0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85/0xc778417E063141139Fce010982780140Aa0cD5Ab/3000')

      cy.wait('@queryAllV3Ticks')

      // TODO: test ticks data (requires stubbing infura pool.tickCurrent)
      cy.get('[data-test-id=liquidity-chart-loader]').should('exist')
    })
  })
})
