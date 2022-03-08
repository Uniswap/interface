describe('SWAP - Wrapp functionality', () => {
  before(() => {
    cy.visit('/')
      .get('#connect-wallet')
      .click()
      .get('#connect-METAMASK')
      .click()
      .acceptMetamaskAccess()
  })
  after(() =>{
    cy.disconnectMetamaskWalletFromAllDapps()
})
  it('should switch network to mainet', () => {
    cy.findByTestId("network-switcher").click()
  })
})