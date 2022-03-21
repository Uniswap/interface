import { TokenMenu } from './TokenMenu'
export class SwapPage {
  static openTokenToSwapMenu() {
    cy.get('[data-testid=select-token-button]').click()
    return TokenMenu
  }
  static typeValueIn(value: string) {
    cy.get('[data-testid=from-value-input]').type(value)
    return this
  }
  static wrap() {
    cy.get('[data-testid=wrap-button]').click()
    return this
  }
  static swap() {
    cy.get('#swap-button').click()
    return this
  }
  static confirmSwap() {
    cy.get('#confirm-swap-or-send').click()
  }
  static connectOrSwitchButton() {
    return cy.get('[data-testid=switch-connect-button]')
  }
}
