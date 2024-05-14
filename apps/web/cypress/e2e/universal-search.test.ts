import { ChainId } from '@ubeswap/sdk-core'
import { UBE } from 'constants/tokens'

import { getTestSelector } from '../utils'

const UBE_ADDRESS = UBE[ChainId.CELO].address.toLowerCase()

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
    // Search for UBE token by name.
    openSearch()
    getSearchBar().clear().type('ube')

    cy.get(getTestSelector(`searchbar-token-row-ETHEREUM-${UBE_ADDRESS}`))
      .should('contain.text', 'Ubeswap')
      .and('contain.text', 'UBE')
      .and('contain.text', '$')
      .and('contain.text', '%')
      .click()
    cy.location('pathname').should('equal', '/explore/tokens/celo/0x71e26d0E519D14591b9dE9a0fE9513A398101490')

    openSearch()
    cy.get(getTestSelector('searchbar-dropdown'))
      .contains(getTestSelector('searchbar-dropdown'), 'Recent searches')
      .find(getTestSelector(`searchbar-token-row-ETHEREUM-${UBE_ADDRESS}`))
      .should('exist')
  })

  it(
    'should go to the selected result when recent results are shown',
    // this test is experiencing flake despite being correct, i can see the right value in DOM
    // but for some reason cypress doesn't find it, so adding retries for now :/
    {
      // @ts-ignore see https://uniswapteam.slack.com/archives/C047U65H422/p1691455547556309
      // basically cypress has bad types due to overlap with jest and you just have to deal with it
      // i tried removing jest types but still happens
      retries: {
        runMode: 3,
        openMode: 3,
      },
    },
    () => {
      // Seed recent results with UBE.
      openSearch()
      getSearchBar().type('ube')
      cy.get(getTestSelector(`searchbar-token-row-ETHEREUM-${UBE_ADDRESS}`))
      getSearchBar().clear().type('{esc}')

      // Search a different token by name.
      openSearch()
      getSearchBar().type('eth')
      cy.get(getTestSelector('searchbar-token-row-ETHEREUM-NATIVE'))

      // Validate that we go to the searched/selected result.
      cy.get(getTestSelector('searchbar-token-row-ETHEREUM-NATIVE')).click()
      cy.url().should('contain', '/explore/tokens/celo/NATIVE')
    }
  )
})
