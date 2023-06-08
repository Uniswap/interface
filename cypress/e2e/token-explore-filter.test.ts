describe('Token explore filter', () => {
  beforeEach(() => {
    cy.visit('/tokens')
  })

  function aliasFilteredTokens(filter: string) {
    cy.get('[data-cy="token-name"]').then((tokens) => {
      cy.wrap(Array.from(tokens).filter((token) => token.innerText.toLowerCase().includes(filter))).as('filteredTokens')
    })
  }

  function searchFor(filter: string) {
    cy.get('[data-cy="explore-tokens-search-input"]').clear().type(filter).type('{enter}')
  }

  it('should filter correctly by dao search term', () => {
    aliasFilteredTokens('dao')
    searchFor('dao')

    cy.get('@filteredTokens').then((filteredTokens) => {
      cy.get('[data-cy="token-name"]').should('deep.equal', filteredTokens)
    })
  })
})
