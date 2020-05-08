describe('Homepage', () => {
  beforeEach(() => cy.visit('/'))
  it('loads exchange page', () => {
    cy.get('#exchangePage')
  })

  it('has url /swap', () => {
    cy.url().should('include', '/swap')
  })

  it('can enter an amount into input', () => {
    cy.get('#swapInputField').type('0.001')
  })

  it('can enter an amount into output', () => {
    cy.get('#swapOutputField').type('0.001')
  })
})
