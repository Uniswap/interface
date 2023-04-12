describe('Position', () => {
  it('shows an valid state on a supported network', () => {
    cy.visit('/pools/1')
    cy.contains('UNI / ETH')
  })

  it('shows an invalid state on a supported network', () => {
    cy.visit('/pools/788893')
    cy.contains('To view a position, you must be connected to the network it belongs to.')
  })
})
