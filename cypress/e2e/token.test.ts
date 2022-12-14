import { getTestSelector, getTestSelectorStartsWith } from '../utils'

describe('Testing tokens on uniswap page', () => {
  before(() => {
    cy.visit('/')
  })

  it('should load token leaderboard', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelectorStartsWith('token-table')).its('length').should('be.gte', 25)
  })

  it('should load go to ethereum token and return to token list page', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelector('token-table-row-Ether')).click()
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-return-button')).click()
    cy.get(getTestSelectorStartsWith('token-table')).its('length').should('be.gte', 25)
  })
})
