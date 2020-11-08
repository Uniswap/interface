describe('Warning', () => {
  beforeEach(() => {
    cy.visit('/swap?outputCurrency=0xFCFc53c4301ecD7ca6b37541be52c50a33F64d79')
  })

  it('Check that warning is displayed', () => {
    cy.get('.token-warning-container').should('be.visible')
  })

  it('Check that warning hides after button dismissal', () => {
    cy.get('.token-dismiss-button').should('be.disabled')
    cy.get('.understand-checkbox').click()
    cy.get('.token-dismiss-button').should('not.be.disabled')
    cy.get('.token-dismiss-button').click()
    cy.get('.token-warning-container').should('not.be.visible')
  })
})
