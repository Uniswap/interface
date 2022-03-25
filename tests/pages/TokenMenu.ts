import { SwapPage } from './SwapPage'

export class TokenMenu {
  static chooseToken(token: string) {
    cy.scrollTo('top')
    cy.get('#token-search-input')
      .should('be.visible')
      .type(token, { force: true })
    cy.get('[data-testid=select-button-' + token + ']')
      .should('be.visible')
      .click({ force: true })
    return SwapPage
  }
  static getOpenTokenManagerButton() {
    return cy.get('[data-testid=manage-token-lists-button]')
  }
}
