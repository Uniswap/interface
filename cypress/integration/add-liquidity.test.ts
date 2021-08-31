import * as feeTierDistributionJson from '../fixtures/subgraph/feeTierDistribution.json'
import * as allV3TicksJson from '../fixtures/subgraph/allV3Ticks.json'

import { hasQuery } from '../utils/graphql-test-utils'

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
    beforeEach(() => {
      cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req) => {
        if (hasQuery(req, 'feeTierDistribution')) {
          req.alias = 'queryFeeTierDistribution'
          req.reply(feeTierDistributionJson)
        } else if (hasQuery(req, 'allV3Ticks')) {
          req.alias = 'queryAllV3Ticks'
          req.reply(allV3TicksJson)
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
