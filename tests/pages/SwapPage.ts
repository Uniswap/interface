import { TokenMenu } from './TokenMenu'
export class SwapPage {
  static openTokenToSwapMenu() {
    cy.findByTestId('select-token-button').click()
    return TokenMenu
  }
  static typeValueIn(value: string) {
    cy.findByTestId('from-value-input').type(value)
    return this
  }
  static wrap() {
    cy.findByTestId('wrap-button').click()
    return this
  }
  static swap() {
    cy.get('#swap-button').click()
    return this
  }
  static confirmSwap() {
    cy.get('#confirm-swap-or-send').click()
  }
}
