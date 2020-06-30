describe('Send', () => {
  beforeEach(() => cy.visit('/send'))

  it('can enter an amount into input', () => {
    cy.get('#sending-no-swap-input')
      .type('0.001', { delay: 200 })
      .should('have.value', '0.001')
  })
})
