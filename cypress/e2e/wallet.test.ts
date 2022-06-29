import { TEST_ADDRESS_NEVER_USE_SHORTENED } from '../support/ethereum'

describe('Wallet', () => {
  before(() => {
    cy.visit('/')
  })

  it('displays account details', () => {
    cy.findByTestId('web3-status-connected').contains(TEST_ADDRESS_NEVER_USE_SHORTENED).click()
  })

  it('displays account view in wallet modal', () => {
    cy.findByTestId('web3-account-identifier-row').contains(TEST_ADDRESS_NEVER_USE_SHORTENED)
  })

  it('changes back to the options grid', () => {
    cy.findByTestId('wallet-change').click()
    cy.findByTestId('option-grid').should('exist')
  })

  it('selects injected wallet option', () => {
    cy.contains('Injected').click()
    cy.findByTestId('web3-account-identifier-row').contains(TEST_ADDRESS_NEVER_USE_SHORTENED)
  })

  it('shows connect buttons after disconnect', () => {
    cy.findByTestId('data-testid=wallet-disconnect').click()
    cy.findByTestId('data-testid=option-grid').should('exist')
  })
})
