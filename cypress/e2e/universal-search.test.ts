import { getTestSelector } from '../utils'

describe('Universal search bar', () => {
  before(() => {
    cy.visit('/')
    cy.get('[data-cy="magnifying-icon"]')
      .parent()
      .then(($navIcon) => {
        $navIcon.click()
      })
  })

  it('should yield no results found when contract address is search term', () => {
    // Search for uni token contract address.
    cy.get('[data-cy="search-bar-input"]').last().type('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('[data-cy="search-bar"]')
      .should('contain.text', 'No tokens found.')
      .and('contain.text', 'No NFT collections found.')
  })

  it('should yield clickable result for regular token or nft collection search term', () => {
    // Search for uni token by name.
    cy.get('[data-cy="search-bar-input"]').last().clear().type('uni')
    cy.get('[data-cy="searchbar-token-row-UNI"]')
      .should('contain.text', 'Uniswap')
      .and('contain.text', 'UNI')
      .and('contain.text', '$')
      .and('contain.text', '%')
    cy.get('[data-cy="searchbar-token-row-UNI"]').click()

    cy.get('div').contains('Uniswap').should('exist')
    // Stats should have: TVL, 24H Volume, 52W low, 52W high.
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-stats')).within(() => {
      cy.get('[data-cy="tvl"]').should('include.text', '$')
      cy.get('[data-cy="volume-24h"]').should('include.text', '$')
      cy.get('[data-cy="52w-low"]').should('include.text', '$')
      cy.get('[data-cy="52w-high"]').should('include.text', '$')
    })

    // About section should have description of token.
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.contains('UNI is the governance token for Uniswap').should('exist')
  })

  it('should show recent tokens and popular tokens with empty search term', () => {
    cy.get('[data-cy="magnifying-icon"]')
      .parent()
      .then(($navIcon) => {
        $navIcon.click()
      })
    // Recently searched UNI token should exist.
    cy.get('[data-cy="search-bar-input"]').last().clear()
    cy.get('[data-cy="searchbar-dropdown"]')
      .contains('[data-cy="searchbar-dropdown"]', 'Recent searches')
      .find('[data-cy="searchbar-token-row-UNI"]')
      .should('exist')

    // Most popular 3 tokens should be shown.
    cy.get('[data-cy="searchbar-dropdown"]')
      .contains('[data-cy="searchbar-dropdown"]', 'Popular tokens')
      .find('[data-cy^="searchbar-token-row"]')
      .its('length')
      .should('be.eq', 3)
  })

  it('should show blocked badge when blocked token is searched for', () => {
    // Search for mTSLA, which is a blocked token.
    cy.get('[data-cy="search-bar-input"]').last().clear().type('mtsla')
    cy.get('[data-cy="searchbar-token-row-mTSLA"]').find('[data-cy="blocked-icon"]').should('exist')
  })
})
