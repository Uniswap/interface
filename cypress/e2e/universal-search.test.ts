// **Action**: Click on search bar
import { getTestSelector } from '../utils'

// **Expectation**: See top 4 tokens (”popular” = by uniswap volume) of the global network

// - If there are recent searches, see up to 2 most recent searches
// - If global network isn’t mainnet:
//     - Recent searches should stay the same, regardless of what network they were on
//     - Popular tokens list should be the top 4 tokens of that network

describe('Universal search bar', () => {
  before(() => {
    cy.visit('/')
  })

  it('should yield no results found when contract address is search term', () => {
    // **Action**: Type in token contract address

    // **Expectation**: Result box should say “No tokens found.”
    cy.get('[data-cy="magnifying-icon"]')
      .parent()
      .then(($navIcon) => {
        $navIcon.click()
      })
    // Search for uni token contract address
    cy.get('[data-cy="search-bar-input"]').last().type('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('[data-cy="search-bar"]')
      .should('contain.text', 'No tokens found.')
      .and('contain.text', 'No NFT collections found.')
  })

  it('should yield clickable result for regular token or nft collection search term', () => {
    // **Action**: Click on token from results menu
    // **Expectation**: Land on Token Details page of that token, with all info filled in

    // Search for uni token by name
    cy.get('[data-cy="search-bar-input"]').last().clear().type('uni')
    cy.get('[data-cy="searchbar-token-row-UNI"]').click()

    cy.get('div').contains('Uniswap').should('exist')
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
  })

  it('should show blocked badge when blocked token is searched for', () => {
    cy.get('[data-cy="magnifying-icon"]')
      .parent()
      .then(($navIcon) => {
        $navIcon.click()
      })
    // Search for mTSLA, which is a blocked token.
    cy.get('[data-cy="search-bar-input"]').last().clear().type('mtsla')
    cy.get('[data-cy="searchbar-token-row-mTSLA"]').find('[data-cy="blocked-icon"]').should('exist')
  })
})
