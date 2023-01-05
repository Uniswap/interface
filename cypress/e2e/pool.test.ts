import { getTestSelector } from '../utils'

describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))

  it('add liquidity links to /add/ETH', () => {
    cy.get(getTestSelector('FiatOnrampAnnouncement-close')).first().click()
    cy.get('#join-pool-button').click()
    cy.url().should('contain', '/add/ETH')
  })
})
