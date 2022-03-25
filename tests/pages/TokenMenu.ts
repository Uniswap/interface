import { SwapPage } from './SwapPage'

export class TokenMenu {
  static chooseToken(token: string) {
    cy.scrollTo('top')
    cy.get('#token-search-input')
      .should('be.visible')
      .type(token)
      .click()
      .type('{enter}')
      .should('not.exist')
    return SwapPage
  }
  static getOpenTokenManagerButton() {
    return cy.get('[data-testid=manage-token-lists-button]')
  }
  static getPicker() {
    return cy.get('[data-testid=token-picker]')
  }
}
