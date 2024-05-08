describe('Redirect', () => {
  it('should redirect to /vote/create-proposal when visiting /create-proposal', () => {
    cy.visit('/create-proposal')
    cy.url().should('match', /\/vote\/create-proposal/)
  })
  it('should redirect to /not-found when visiting nonexist url', () => {
    cy.visit('/none-exist-url')
    cy.url().should('match', /\/not-found/)
  })
})

describe('RedirectExplore', () => {
  it('should redirect from /tokens/ to /explore', () => {
    cy.visit('/tokens')
    cy.url().should('match', /\/explore/)

    cy.visit('/tokens/ethereum')
    cy.url().should('match', /\/explore\/tokens\/ethereum/)

    cy.visit('/tokens/optimism/NATIVE')
    cy.url().should('match', /\/explore\/tokens\/optimism\/NATIVE/)
  })
})
