import { SwapPage } from './SwapPage'

export class TokenMenu {
  static chooseToken(token: string) {
    cy.scrollTo('top')
    cy.get('#token-search-input')
      .should('be.visible')
      .type(token)
    cy.get('[data-testid=select-button-' + token + ']')
      .should('be.visible')
      .then(e => e.click())
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
