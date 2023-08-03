import { getTestSelector } from '../utils'

describe('Universal search bar', () => {
  function openSearch() {
    // can't just type "/" because on mobile it doesn't respond to that
    cy.get('[data-cy="magnifying-icon"]').parent().eq(1).click()
  }

  beforeEach(() => {
    cy.visit('/')
  })

  function getSearchBar() {
    return cy.get('[data-cy="search-bar-input"]').last()
  }

  it('should yield clickable result that is then added to recent searches', () => {
    // Search for UNI token by name.
    openSearch()
    getSearchBar().clear().type('uni')

    cy.get(getTestSelector('searchbar-token-row-UNI'))
      .should('contain.text', 'Uniswap')
      .and('contain.text', 'UNI')
      .and('contain.text', '$')
      .and('contain.text', '%')
      .click()
    cy.location('hash').should('equal', '#/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')

    openSearch()
    cy.get(getTestSelector('searchbar-dropdown'))
      .contains(getTestSelector('searchbar-dropdown'), 'Recent searches')
      .find(getTestSelector('searchbar-token-row-UNI'))
      .should('exist')
  })

  it('should go to the selected result when recent results are shown', () => {
    // Seed recent results with UNI.
    openSearch()
    getSearchBar().type('uni')
    cy.get(getTestSelector('searchbar-token-row-UNI'))
    getSearchBar().clear().type('{esc}')

    // Search a different token by name.
    openSearch()
    getSearchBar().type('eth')
    cy.get(getTestSelector('searchbar-token-row-ETH'))

    // Validate that we go to the searched/selected result.
    getSearchBar().type('{enter}')
    cy.url().should('contain', 'tokens/ethereum/NATIVE')
  })
})
