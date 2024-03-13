import { getTestSelector } from '../utils'

describe('Token explore filter', () => {
  beforeEach(() => {
    cy.visit('/tokens')
  })

  function aliasFilteredTokens(filter: string) {
    cy.get(getTestSelector('token-name')).then((tokens) => {
      cy.wrap(Array.from(tokens).filter((token) => token.innerText.toLowerCase().includes(filter))).as('filteredTokens')
    })
  }

  function searchFor(filter: string) {
    cy.get(getTestSelector('explore-tokens-search-input')).clear().type(filter).type('{enter}')
    // wait for it to finish the filtered render
    cy.get(getTestSelector('token-name')).first().contains(filter, {
      matchCase: false,
    })
  }

  it('should filter correctly by dao search term', () => {
    aliasFilteredTokens('dao')
    searchFor('dao')

    cy.get('@filteredTokens').then((filteredTokens) => {
      const filteredTokenTexts = Cypress.$(filteredTokens)
        .map((i, token) => token.innerText)
        .get()

      cy.get(getTestSelector('token-name')).then((tokens) => {
        const tokenTexts = Cypress.$(tokens)
          .map((i, token) => token.innerText)
          .get()

        cy.wrap(tokenTexts).should('deep.equal', filteredTokenTexts)
      })
    })
  })
})
