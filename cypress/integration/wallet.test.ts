import { TEST_ADDRESS_NEVER_USE_SHORTENED } from '../support/commands'

describe('Wallet', () => {
  before(() => {
    cy.visit('/')
  })

  it('displays account details', () => {
    cy.get('#web3-status-connected').contains(TEST_ADDRESS_NEVER_USE_SHORTENED).click()
  })

  it('displays account view in wallet modal', () => {
    cy.get('#web3-account-identifier-row').contains(TEST_ADDRESS_NEVER_USE_SHORTENED)
  })

  it('changes back to the options grid', () => {
    cy.get('[data-cy=wallet-change]').click()
    cy.get('[data-cy=option-grid]').should('exist')
  })

  it('selects injected wallet option', () => {
    cy.contains('Injected').click()
    cy.get('#web3-account-identifier-row').contains(TEST_ADDRESS_NEVER_USE_SHORTENED)
  })

  it('disconnects the wallet', () => {
    cy.get('[data-cy=wallet-disconnect]').click()
    cy.get('[data-cy=option-grid]').should('exist')
  })

  it('shows connect buttons', () => {
    cy.reload()
    cy.get('#connect-wallet').click()
    cy.get('[data-cy=option-grid]').should('exist')
  })
})
