// **Action**: Click on search bar

// **Expectation**: See top 4 tokens (”popular” = by uniswap volume) of the global network

// - If there are recent searches, see up to 2 most recent searches
// - If global network isn’t mainnet:
//     - Recent searches should stay the same, regardless of what network they were on
//     - Popular tokens list should be the top 4 tokens of that network

describe('Universal search bar', () => {
  before(() => {
    cy.visit('/')
  })

  it('should show no results found when contract address is search term', () => {
    // **Action**: Type in token contract address

    // **Expectation**: Result box should say “No tokens found.”
    cy.get('[data-cy="magnifying-icon"]')
      .parent()
      .then(($navIcon) => {
        $navIcon.click()
      })
    cy.get('[data-cy="search-bar-input"]').last().type('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('[data-cy="search-bar"]')
      .should('contain.text', 'No tokens found.')
      .and('contain.text', 'No NFT collections found.')
  })

  it('should show no results found when contract address is search term', () => {
    // **Action**: Click on token from results menu
    // **Expectation**: Land on Token Details page of that token, with all info filled in
  })

  it('should show no results found when contract address is search term', () => {
    /// **Action**: Search for blocked token
    // **Expectation**: Token should show in results, but have a blocked badge next to it (
  })
})
