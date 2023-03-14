import { getTestSelector } from '../utils'

describe('Token details', () => {
  before(() => {
    cy.visit('/')
  })

  it('Uniswap token should have all information populated', () => {
    // Uniswap token
    cy.visit('/tokens/ethereum/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')

    // Price chart should be filled in
    cy.get('[data-cy="chart-header"]').should('include.text', '$')
    cy.get('[data-cy="price-chart"]').should('exist')

    // Stats should have: TVL, 24H Volume, 52W low, 52W high
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-stats')).within(() => {
      cy.get('[data-cy="tvl"]').should('include.text', '$')
      cy.get('[data-cy="volume-24h"]').should('include.text', '$')
      cy.get('[data-cy="52w-low"]').should('include.text', '$')
      cy.get('[data-cy="52w-high"]').should('include.text', '$')
    })

    // About section should have description of token
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.contains('UNI is the governance token for Uniswap').should('exist')

    // Links section should link out to Etherscan, More analytics, Website, Twitter
    cy.get('[data-cy="resources-container"]').within(() => {
      cy.contains('Etherscan')
        .should('have.attr', 'href')
        .and('include', 'etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
      cy.contains('More analytics')
        .should('have.attr', 'href')
        .and('include', 'info.uniswap.org/#/tokens/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
      cy.contains('Website').should('have.attr', 'href').and('include', 'uniswap.org')
      cy.contains('Twitter').should('have.attr', 'href').and('include', 'twitter.com/Uniswap')
    })

    // Contract address should be displayed
    cy.contains('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984').should('exist')

    // Swap widget should have this token pre-selected as the “destination” token
    cy.get(getTestSelector('token-select')).should('include.text', 'UNI')
  })

  it('token with warning and low trading volume should have all information populated', () => {
    // Shiba predator token, low trading volume and also has warning modal
    cy.visit('/tokens/ethereum/0xa71d0588EAf47f12B13cF8eC750430d21DF04974')

    // Should have missing price chart when price unavailable (expected for this token)
    if (cy.get('[data-cy="chart-header"]').contains('Price Unavailable')) {
      cy.get('[data-cy="missing-chart"]').should('exist')
    }
    // Stats should have: TVL, 24H Volume, 52W low, 52W high
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-stats')).within(() => {
      cy.get('[data-cy="tvl"]').should('exist')
      cy.get('[data-cy="volume-24h"]').should('exist')
      cy.get('[data-cy="52w-low"]').should('exist')
      cy.get('[data-cy="52w-high"]').should('exist')
    })

    // About section should have description of token
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.contains('QOM is the Shiba Predator').should('exist')

    // Links section should link out to Etherscan, More analytics, Website, Twitter
    cy.get('[data-cy="resources-container"]').within(() => {
      cy.contains('Etherscan')
        .should('have.attr', 'href')
        .and('include', 'etherscan.io/address/0xa71d0588EAf47f12B13cF8eC750430d21DF04974')
      cy.contains('More analytics')
        .should('have.attr', 'href')
        .and('include', 'info.uniswap.org/#/tokens/0xa71d0588EAf47f12B13cF8eC750430d21DF04974')
      cy.contains('Website').should('have.attr', 'href').and('include', 'qom')
      cy.contains('Twitter').should('have.attr', 'href').and('include', 'twitter.com/ShibaPredator1')
    })

    // Contract address should be displayed
    cy.contains('0xa71d0588EAf47f12B13cF8eC750430d21DF04974').should('exist')

    // Swap widget should have this token pre-selected as the “destination” token
    cy.get(getTestSelector('token-select')).should('include.text', 'QOM')

    // Warning label should show if relevant ([spec](https://www.notion.so/3f7fce6f93694be08a94a6984d50298e))
    cy.get('[data-cy="token-safety-message"]')
      .should('include.text', 'Warning')
      .and('include.text', "This token isn't traded on leading U.S. centralized exchanges")
  })
})
