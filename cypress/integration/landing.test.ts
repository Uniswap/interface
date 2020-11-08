import { TEST_ADDRESS_NEVER_USE_SHORTENED } from '../support/commands'

describe('Landing Page', () => {
  describe('Mainnet/Ropsten', () => {
    beforeEach(() => {
      const options: any = { networkName: 'ropsten' }
      cy.visit('/', options)
    })
    it('loads bridge page', () => {
      cy.get('#bridge-page')
    })

    it('redirects to url /bridge', () => {
      cy.url().should('include', '/bridge')
    })

    it('allows navigation to pool', () => {
      cy.get('#pool-nav-link').click()
      cy.url().should('include', '/pool')
    })

    it('allows navigation to swap', () => {
      cy.get('#swap-nav-link').click()
      cy.url().should('include', '/swap')
    })

    it('is connected', () => {
      cy.get('#web3-status-connected').click()
      cy.get('#web3-account-identifier-row').contains(TEST_ADDRESS_NEVER_USE_SHORTENED)
    })
  })

  describe('Fuse', () => {
    beforeEach(() => cy.visit('/'))
    it('loads swap page', () => {
      cy.get('#swap-page')
    })

    it('redirects to url /swap', () => {
      cy.url().should('include', '/swap')
    })

    it('allows navigation to pool', () => {
      cy.get('#pool-nav-link').click()
      cy.url().should('include', '/pool')
    })

    it('allows navigation to bridge', () => {
      cy.get('#bridge-nav-link').click()
      cy.url().should('include', '/bridge')
    })

    it('is connected', () => {
      cy.get('#web3-status-connected').click()
      cy.get('#web3-account-identifier-row').contains(TEST_ADDRESS_NEVER_USE_SHORTENED)
    })
  })
})
