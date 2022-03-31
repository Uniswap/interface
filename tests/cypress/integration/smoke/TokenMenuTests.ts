import { SwapPage } from '../../../pages/SwapPage'
import { TokenMenu } from '../../../pages/TokenMenu'
import { AddressesEnum } from '../../../utils/AddressesEnum'

describe('Token menu smoke tests', () => {
  beforeEach(() => {
    cy.visit('/swap')
    cy.intercept('GET', 'https://ipfs.io/ipfs/*').as('request')
    cy.wait('@request')
      .its('response.statusCode')
      .should('equal', 200)
    SwapPage.openTokenToSwapMenu()
  })
  it('Should open token list manager and should display list as default', () => {
    TokenMenu.openTokenManager()
    TokenMenu.getTokenListManager().should('be.visible')
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'list')
  })
  it('Should switch between token lists manage and tokens manage', () => {
    TokenMenu.openTokenManager()
    TokenMenu.switchTokenManagerToTokens()
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'token')
    TokenMenu.switchTokenManagerToLists()
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'list')
  })
  it('Should add additional token', () => {
    TokenMenu.openTokenManager()
    TokenMenu.getSingleTokenManagerInput().type(AddressesEnum.ADOBE_TOKEN)
    TokenMenu.getTokenManagerRow('adobe').should('be.visible')
    TokenMenu.importToken('adobe')
    TokenMenu.getTokenImportWarning().should('be.visible')
    TokenMenu.confirmTokenImport()
    SwapPage.getCurrencySelectors()
      .last()
      .should('contain.text', 'Adobe')
  })
  it('Should display warning when single token address is invalid', () => {
    TokenMenu.openTokenManager()
    TokenMenu.getSingleTokenManagerInput().type('Definitely Not Token Address')
    TokenMenu.getTokenManagerErrorMessage()
      .should('be.visible')
      .should('contain.text', 'Enter valid token address')
  })
  it('Should display warning when token list address is invalid', () => {
    TokenMenu.openTokenManager()
    TokenMenu.getTokenListManagerInput().type('Definitely Not list Address')
    TokenMenu.getTokenManagerErrorMessage()
      .should('be.visible')
      .should('contain.text', 'Enter valid list location')
  })
  it('Should disable all token lists', () => {
    TokenMenu.openTokenManager()
    TokenMenu.switchTokenList('swapr-token-list')
    TokenMenu.getTokenListsRow('swapr-token-list').should('contain.text', 'OFF')
    TokenMenu.goBack()
      .getPicker()
      .should('contain.text', 'No results found')
  })
  it('Should find token by valid address', () => {
    TokenMenu.getSingleTokenManagerInput().type(AddressesEnum.DXD_TOKEN)
    TokenMenu.getTokenRow('dxd').should('be.visible')
  })
  it('Should find token by name', () => {
    TokenMenu.getSingleTokenManagerInput().type('dxd')
    TokenMenu.getTokenRow('dxd').should('be.visible')
  })
})
