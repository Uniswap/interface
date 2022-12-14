import { getTestSelector, getTestSelectorStarsWith } from '../utils'

describe('Testing nfts', () => {
  before(() => {
    cy.visit('/')
  })

  it('should load nft leaderboard', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelectorStarsWith('token-table')).its('length').should('be.gte', 25)
  })

  it('should load go to ethereum token and return to token list page', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelector('token-table-row-Ether')).first().click()
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-return-button')).click()
    cy.get(getTestSelectorStarsWith('token-table')).its('length').should('be.gte', 25)
  })
})
