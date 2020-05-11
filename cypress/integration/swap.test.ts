describe('Swap', () => {
  beforeEach(() => cy.visit('/swap'))
  it('can enter an amount into input', () => {
    cy.get('#swapInputField').type('0.001')
  })

  it('can enter an amount into output', () => {
    cy.get('#swapOutputField').type('0.001')
  })
})
