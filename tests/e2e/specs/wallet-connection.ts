//Accepting metamask accept and disconnecting wallet

describe('Connecting wallet', () => {
  before(() => {
    cy.visit('/')
  })
  
  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps()
  })
  
  it('should connect wallet with Rinkeby network', () => {
    cy.get('#connect-wallet')
      .click()
      .get('#connect-METAMASK')
      .click()
      .wait(10000)
      .acceptMetamaskAccess()
    cy.findByTestId('network-switcher')
      .should('contain.text', 'Rinkeby')
      .wait(10000)
  })
})

describe('Disconnecting wallet', () => {
  before(() => {
    cy.visit('/')
    cy.get('#connect-wallet')
      .click()
      .get('#connect-METAMASK')
      .click()
      .acceptMetamaskAccess()
  })

  it('should disconnect wallet', () => {
    cy.disconnectMetamaskWalletFromAllDapps()
    cy.get('#connect-wallet')
      .should('contain.text', 'Connect wallet').and("be.visible")
      .wait(10000)
  })
})
