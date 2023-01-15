describe('Token explore filter', () => {
  before(() => {
    cy.visit('/')
  })

  it('should filter tokens correctly based on user input', () => {
    cy.visit('/tokens/ethereum')
    cy.get('[data-cy="token-name"]').then(($els) => {
      const tokenNames = Array.from($els, (el) => el.innerText)
      const filteredByUni = tokenNames.filter((tokenName) => tokenName.toLowerCase().includes('uni'))
      const filteredByDao = tokenNames.filter((tokenName) => tokenName.toLowerCase().includes('dao'))
      const filteredByUsd = tokenNames.filter((tokenName) => tokenName.toLowerCase().includes('usd'))
      cy.wrap(tokenNames).as('tokenNames')
      cy.wrap(filteredByUni).as('filteredByUni')
      cy.wrap(filteredByDao).as('filteredByDao')
      cy.wrap(filteredByUsd).as('filteredByUsd')
      cy.get('@tokenNames').its('length').should('be.eq', 100)
    })

    // todo: filter for UNI

    // todo: filter for DAO

    // todo: filter for USD
  })
})
