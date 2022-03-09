//accepting transaction and etherscan
import "cypress-localstorage-commands"

describe('SWAP - Wrapp functionality', () => {

  before(() => {
    cy.visit('/')
      .get('#connect-wallet')
      .click()
      .get('#connect-METAMASK')
      .click()
      .acceptMetamaskAccess()
  })
  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps()
  })
  it('Should wrap 1 eth to 1 weth', () => {
    cy.findByTestId('select-token-button')
      .click()
      .get('#token-search-input')
      .type('WETH')
    cy.findByTestId('select-button-weth')
      .click({ force: true })
      .get('[data-testid=from-value-input]')
      .type('0.000000001')
      .wait(5000)
      .get('[data-testid=wrap-button]')
      .click()
      .confirmMetamaskTransaction({})
  })
})


