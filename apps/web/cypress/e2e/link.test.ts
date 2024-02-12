// see https://github.com/Uniswap/interface/pull/4115
describe('Link', () => {
  // TODO re-enable web test
  it.skip('should update route', () => {
    cy.viewport(2000, 1600)
    cy.visit('/swap')
    cy.contains('Pool').click()
    cy.get('[data-cy="join-pool-button"]').should('exist')
  })
})
