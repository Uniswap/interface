import { TokenMenu } from './TokenMenu'

export class SwapPage {
  static visitSwapPage() {
    cy.visit('/swap')
  }

  static openTokenToSwapMenu() {
    cy.get('[data-testid=select-token-button]').click()
    return TokenMenu
  }

  static typeValueFrom(value: string) {
    this.getFromInput().type(value)
    return this
  }
  static typeValueTo(value: string) {
    this.getToInput().type(value)
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

  static getSwapBox() {
    return cy.get('#swap-page')
  }

  static getCurrencySelectors() {
    return cy.get('.open-currency-select-button')
  }

  static getFromInput() {
    return cy.get('[data-testid=transaction-value-input]').first()
  }
  static getToInput() {
    return cy.get('[data-testid=transaction-value-input]').last()
  }
  static switchTokens() {
    return cy.get('[data-testid=switch-tokens-button').click()
  }
  static getWalletConnectList() {
    return cy.get('[data-testid=wallet-connect-list]')
  }
  static getConfirmButton() {
    return cy.get('[data-testid=switch-connect-button]')
  }
}
