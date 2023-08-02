import { CyHttpMessages } from 'cypress/types/net-stubbing'

import { aliasQuery, hasQuery } from '../utils/graphql-test-utils'

describe('Add Liquidity', () => {
  beforeEach(() => {
    cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req) => {
      aliasQuery(req, 'feeTierDistribution')
    })
  })

  it('loads the token pair', () => {
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/ETH/500')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'ETH')
    cy.contains('0.05% fee tier')
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
    cy.fixture('feeTierDistribution.json').then((feeTierDistribution) => {
      cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req: CyHttpMessages.IncomingHttpRequest) => {
        if (hasQuery(req, 'FeeTierDistribution')) {
          req.alias = 'FeeTierDistribution'

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

      cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/ETH')
      cy.wait('@FeeTierDistribution')
      cy.get('#add-liquidity-selected-fee .selected-fee-label').should('contain.text', '0.3% fee tier')
      cy.get('#add-liquidity-selected-fee .selected-fee-percentage').should('contain.text', '40% select')
    })
  })
})
