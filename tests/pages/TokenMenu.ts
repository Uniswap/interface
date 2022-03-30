import { SwapPage } from './SwapPage'

export class TokenMenu {
  static chooseToken(token: string) {
    cy.scrollTo('top')
    this.getSingleTokenManagerInput()
      .should('be.visible')
      .type(token)
      .click()
      .type('{enter}{enter}')
      .should('not.exist')
    return SwapPage
  }
  static getOpenTokenManagerButton() {
    return cy.get('[data-testid=manage-token-lists-button]')
  }
  static getPicker() {
    return cy.get('[data-testid=token-picker]')
  }
  static openTokenManager() {
    this.getOpenTokenManagerButton().click()
    return this
  }
  static getTokenListManager() {
    return cy.get('[data-testid=token-list-manager')
  }
  static getTokenListManagerTitle() {
    return cy.get('[data-testid=token-manager-title')
  }
  static switchTokenManagerToTokens() {
    this.getSwitchTokenManagerToTokens().click()
  }
  static switchTokenManagerToLists() {
    this.getSwitchTokenManagerToLists().click()
  }
  static getSwitchTokenManagerToTokens() {
    return cy.get('[data-testid=switch-to-tokens-button')
  }
  static getSwitchTokenManagerToLists() {
    return cy.get('[data-testid=switch-to-lists-button')
  }
  static getSingleTokenManagerInput() {
    return cy.get('#token-search-input')
  }
  static getTokenListManagerInput() {
    return cy.get('#list-add-input')
  }
  static getTokenManagerRow(tokenSymbol: string) {
    return cy.get('[data-testid=' + tokenSymbol + '-token-row]')
  }
  static getImportTokenButton() {
    return cy.get('data-testid=import-button')
  }
  static importToken(tokenSymbol: string) {
    this.getTokenManagerRow(tokenSymbol)
      .get('[data-testid=import-button]')
      .should('be.visible')
      .click()
  }
  static getTokenImportWarning() {
    return cy.get('[data-testid=unknown-token-warning]')
  }
  static confirmTokenImport() {
    this.getTokenImportWarning()
      .get('[data-testid=confirm-import-button]')
      .click()
  }
  static getTokenListsRow(tokenListName: string) {
    return cy.get('[data-testid=' + tokenListName + '-row]')
  }
  static switchTokenList(tokenListName: string) {
    this.getTokenListsRow(tokenListName).within(() => {
      cy.get('[data-testid=list-toggle]').click()
    })
  }
  static goBack() {
    cy.get('[data-testid=go-back-icon]').click()
    return this
  }
  static getTokenRow(tokenName: string) {
    return cy.get('[data-testid=select-button-' + tokenName + ']')
  }
  static getSingleTokenMenageWindow() {
    return cy.get('[data-testid=single-token-manage]')
  }
  static getTokenListMenageWindow() {
    return cy.get('[data-testid=token-lists-manage]')
  }
  static getTokenManagerErrorMessage() {
    return cy.get('[data-testid=token-manager-error-message]')
  }
  static getCommonTokens() {
    return cy.get('[data-testid=common-tokens]')
  }
}
