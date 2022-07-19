// see https://github.com/Uniswap/interface/pull/4115
describe('Link', () => {
  it('should update route', () => {
    cy.visit('/')
    cy.get('[data-cy="pool-nav-link"]').click()
    cy.get('[data-cy="join-pool-button"]').should('exist')
  })
})
