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
      .getOpenTokenManagerButton()
      .click()
  })
  it('Should open token list manager and should display list as default', () => {
    TokenMenu.getTokenListManager().should('be.visible')
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'list')
  })
  it('Should switch between token lists manage and tokens manage', () => {
    TokenMenu.switchTokenManagerToTokens()
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'token')
    TokenMenu.switchTokenManagerToLists()
    TokenMenu.getTokenListManagerTitle().should('contain.text', 'list')
  })
  it('Should add additional token', () => {
    TokenMenu.getTokenManagerInput().type(AddressesEnum.ADOBE_TOKEN)
    TokenMenu.getTokenManagerRow('adobe').should('be.visible')
    TokenMenu.importToken('adobe')
    TokenMenu.getTokenImportWarning().should('be.visible')
    TokenMenu.confirmTokenImport()
    SwapPage.getCurrencySelectors()
      .last()
      .should('contain.text', 'Adobe')
  })
  it('Should disable all token lists', () => {
    TokenMenu.switchTokenList('swapr-token-list')
    TokenMenu.getTokenListsRow('swapr-token-list').should('contain.text', 'OFF')
    TokenMenu.goBack()
      .getPicker()
      .should('contain.text', 'No results found')
  })
})
