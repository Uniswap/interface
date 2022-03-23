export class TokenPicker {
  static getPicker() {
    return cy.get('[data-testid=token-picker]')
  }
}
