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
  it('Should display token picker which contains token input,manage token lists button, common tokens and token list [TC-39]', () => {
    TokenMenu.getPicker().should('be.visible')
    TokenMenu.getCommonTokens().should('be.visible')
    TokenMenu.getSingleTokenManagerInput().should('be.visible')
    TokenMenu.getOpenTokenManagerButton().should('be.visible')
  })
  it('Should open token list manager and should display list as default [TC-40]', () => {
    TokenMenu.openTokenManager()
    TokenMenu.getTokenListManager().should('be.visible')
    TokenMenu.getSwitchTokenManagerToTokens().should('be.visible')
    TokenMenu.getSwitchTokenManagerToLists().should('be.visible')
    TokenMenu.getTokenListManagerInput().should('be.visible')
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'list')
  })
  it('Should switch between token lists manage and tokens manage [TC-41]', () => {
    TokenMenu.openTokenManager()
    TokenMenu.switchTokenManagerToTokens()
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'token')
    TokenMenu.switchTokenManagerToLists()
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'list')
  })
  it('Should add additional token [TC-42]', () => {
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
  it('Should display warning when single token address is invalid [TC-43]', () => {
    TokenMenu.openTokenManager()
    TokenMenu.getSingleTokenManagerInput().type('Definitely Not Token Address')
    TokenMenu.getTokenManagerErrorMessage()
      .should('be.visible')
      .should('contain.text', 'Enter valid token address')
  })
  it('Should display warning when token list address is invalid [TC-44]', () => {
    TokenMenu.openTokenManager()
    TokenMenu.getTokenListManagerInput().type('Definitely Not list Address')
    TokenMenu.getTokenManagerErrorMessage()
      .should('be.visible')
      .should('contain.text', 'Enter valid list location')
  })
  it('Should find token by valid address [TC-45]', () => {
    TokenMenu.getSingleTokenManagerInput().type(AddressesEnum.DXD_TOKEN)
    TokenMenu.getTokenRow('dxd').should('be.visible')
  })
  it('Should find token by name [TC-46]', () => {
    TokenMenu.getSingleTokenManagerInput().type('dxd')
    TokenMenu.getTokenRow('dxd').should('be.visible')
  })
  it('Should disable all token lists [TC-47]', () => {
    TokenMenu.openTokenManager()
    TokenMenu.switchTokenList('swapr-token-list')
    TokenMenu.getTokenListsRow('swapr-token-list').should('contain.text', 'OFF')
    TokenMenu.goBack()
      .getPicker()
      .should('contain.text', 'No results found')
  })
})
