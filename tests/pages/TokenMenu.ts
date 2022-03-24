import { SwapPage } from './SwapPage'

export class TokenMenu {
  static chooseToken(token: string) {
    cy.get('#token-search-input')
      .type(token)
      .get('[data-testid=select-button-' + token + ']')
      .click({ force: true })
    return SwapPage
  }
}
