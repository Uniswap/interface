import { NATIVE_CHAIN_ID, UNI } from 'constants/tokens'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { getTestSelector } from '../utils'

const UNI_ADDRESS = UNI[UniverseChainId.Mainnet].address.toLowerCase()

describe('Universal search bar', () => {
  function openSearch() {
    // can't just type "/" because on mobile it doesn't respond to that
    return cy.get('[data-cy="right-search-container"] [data-cy="magnifying-icon"]').click()
  }

  beforeEach(() => {
    cy.visit('/')
  })

  function getSearchBar() {
    return cy.get('[data-cy="right-search-container"] [data-cy="search-bar-input"]').click()
  }

  it('should yield clickable result that is then added to recent searches', () => {
    // Search for UNI token by name.
    openSearch()
    getSearchBar().clear().type('uni')

    cy.get(getTestSelector(`searchbar-token-row-ETHEREUM-${UNI_ADDRESS}`))
      .should('contain.text', 'Uniswap')
      .and('contain.text', 'UNI')
      .and('contain.text', '$')
      .and('contain.text', '%')
      .click()
    cy.location('pathname').should('equal', '/explore/tokens/ethereum/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')

    openSearch()
    cy.get(getTestSelector('searchbar-dropdown'))
      .contains(getTestSelector('searchbar-dropdown'), 'Recent searches')
      .find(getTestSelector(`searchbar-token-row-ETHEREUM-${UNI_ADDRESS}`))
      .should('exist')
  })

  it('should go to the selected result when recent results are shown', () => {
    // Seed recent results with UNI.
    openSearch()
    getSearchBar().type('uni')
    cy.get(getTestSelector(`searchbar-token-row-ETHEREUM-${UNI_ADDRESS}`))
    getSearchBar().clear().type('{esc}')

    // Search a different token by name.
    openSearch()
    getSearchBar().type('eth')
    cy.get(getTestSelector(`searchbar-token-row-ETHEREUM-${NATIVE_CHAIN_ID}`))

    // Validate that we go to the searched/selected result.
    cy.get(getTestSelector(`searchbar-token-row-ETHEREUM-${NATIVE_CHAIN_ID}`)).click()
    cy.url().should('contain', `/explore/tokens/ethereum/${NATIVE_CHAIN_ID}`)
  })
})
