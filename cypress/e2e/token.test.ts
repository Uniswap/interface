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

  it('should go to native token on ethereum and render description', () => {
    cy.visit('/tokens/ethereum/NATIVE')
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.contains('Ethereum is a smart contract platform that enables developers').should('exist')
    cy.contains('Etherscan').should('exist')
  })

  it('should go to native token on polygon and render description and links', () => {
    cy.visit('/tokens/polygon/NATIVE')
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.contains('Wrapped Matic on Polygon').should('exist')
    cy.contains('Block Explorer').should('exist')
  })
})
