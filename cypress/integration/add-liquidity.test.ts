import { CyHttpMessages } from 'cypress/types/net-stubbing'
import { aliasQuery, hasQuery } from '../utils/graphql-test-utils'
import { MKR, SKL, WETH } from '../constants/contracts'

describe('Add Liquidity', () => {
  beforeEach(() => {
    cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req) => {
      aliasQuery(req, 'feeTierDistribution')
    })
  })

  it('loads the two correct tokens', () => {
    cy.visit(`/add/${MKR}/${WETH}/500`)
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'MKR')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'WETH')
  })

  it('does not crash if WETH is duplicated', () => {
    cy.visit(`/add/${WETH}/${WETH}`)
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'WETH')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('not.contain.text', 'WETH')
  })

  it('token not in storage is loaded', () => {
    cy.visit(`/add/${SKL}/${MKR}`)
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'SKL')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'MKR')
  })

  it('single token can be selected', () => {
    cy.visit(`/add/${SKL}`)
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'SKL')
    cy.visit(`/add/${MKR}`)
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'MKR')
  })

  it('loads fee tier distribution', () => {
    cy.fixture('feeTierDistribution.json').then((feeTierDistribution) => {
      cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req: CyHttpMessages.IncomingHttpRequest) => {
        if (hasQuery(req, 'feeTierDistribution')) {
          req.alias = 'feeTierDistributionQuery'

          req.reply({
            body: {
              data: {
                ...feeTierDistribution,
              },
            },
            headers: {
              'access-control-allow-origin': '*',
            },
          })
        }
      })

      cy.visit(`/add/${MKR}/${WETH}`)

      cy.wait('@feeTierDistributionQuery')

      cy.get('#add-liquidity-selected-fee .selected-fee-label').should('contain.text', '0.3% fee tier')
      cy.get('#add-liquidity-selected-fee .selected-fee-percentage').should('contain.text', '70%')
    })
  })
})
