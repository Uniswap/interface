describe('Universal search bar', () => {
  function openSearch() {
    // can't just type "/" because on mobile it doesn't respond to that
    cy.get('[data-cy="magnifying-icon"]').parent().eq(1).click()
  }

  beforeEach(() => {
    cy.visit('/')
    openSearch()
  })

  function getSearchBar() {
    return cy.get('[data-cy="search-bar-input"]').last()
  }

  it('should yield clickable result for regular token or nft collection search term', () => {
    // Search for uni token by name.
    getSearchBar().clear().type('uni')
    cy.get('[data-cy="searchbar-token-row-UNI"]')
      .should('contain.text', 'Uniswap')
      .and('contain.text', 'UNI')
      .and('contain.text', '$')
      .and('contain.text', '%')
    cy.get('[data-cy="searchbar-token-row-UNI"]').first().click()
    cy.location('hash').should('equal', '#/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')
  })

  it('should go to the selected result when recent results are shown', () => {
    // Search for uni token by name.
    getSearchBar().type('uni')
    cy.get('[data-cy="searchbar-token-row-UNI"]')

    // Clear search
    getSearchBar().clear()

    // Close search
    getSearchBar().type('{esc}')

    openSearch()

    // Search a different token by name.
    getSearchBar().type('eth')

    // Validate ETH result now exists.
    cy.get('[data-cy="searchbar-token-row-ETH"]')

    // Hit enter
    getSearchBar().type('{enter}')

    // Validate we went to ethereum address
    cy.url().should('contain', 'tokens/ethereum/NATIVE')
  })

  it.skip('should show recent tokens and popular tokens with empty search term', () => {
    cy.get('[data-cy="magnifying-icon"]')
      .parent()
      .then(($navIcon) => {
        $navIcon.click()
      })
    // Recently searched UNI token should exist.
    getSearchBar().clear()
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

  it.skip('should show blocked badge when blocked token is searched for', () => {
    // Search for mTSLA, which is a blocked token.
    getSearchBar().clear().type('mtsla')
    cy.get('[data-cy="searchbar-token-row-mTSLA"]').find('[data-cy="blocked-icon"]').should('exist')
  })
})
