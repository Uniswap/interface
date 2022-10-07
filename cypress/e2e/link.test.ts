// see https://github.com/Uniswap/interface/pull/4115
describe('Link', () => {
  it('should update route', () => {
    cy.visit('/')
    cy.contains('Pool').click()
    cy.contains('Your active V3 liquidity positions will appear here.').should('exist')
  })
})
