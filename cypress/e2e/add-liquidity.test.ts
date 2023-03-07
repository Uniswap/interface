import { CyHttpMessages } from 'cypress/types/net-stubbing'

import { aliasQuery, hasQuery } from '../utils/graphql-test-utils'

describe('Add Liquidity', () => {
  beforeEach(() => {
    cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req) => {
      aliasQuery(req, 'feeTierDistribution')
    })
  })

  it('loads the two correct tokens', () => {
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6/500')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'ETH')
  })

  it('does not crash if ETH is duplicated', () => {
    cy.visit('/add/0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6/0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'ETH')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('not.contain.text', 'ETH')
  })

  it.skip('token not in storage is loaded', () => {
    cy.visit('/add/0x07865c6e87b9f70255377e024ace6630c1eaa37f/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'USDC')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'UNI')
  })

  it.skip('single token can be selected', () => {
    cy.visit('/add/0x07865c6e87b9f70255377e024ace6630c1eaa37f')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'USDC')
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
  })

  it.skip('loads fee tier distribution', () => {
    cy.fixture('feeTierDistribution.json').then((feeTierDistribution) => {
      cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req: CyHttpMessages.IncomingHttpRequest) => {
        if (hasQuery(req, 'FeeTierDistributionQuery')) {
          req.alias = 'FeeTierDistributionQuery'

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

      cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6')

      cy.wait('@FeeTierDistributionQuery')

      cy.get('#add-liquidity-selected-fee .selected-fee-label').should('contain.text', '0.3% fee tier')
      cy.get('#add-liquidity-selected-fee .selected-fee-percentage').should('contain.text', '40%')
    })
  })
})
