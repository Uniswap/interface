import { getTestSelector } from '../utils'

describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))

  it('add liquidity links to /add/ETH', () => {
    cy.find(getTestSelector('FiatOnrampAnnouncement-close')).then((result) => {
      if (result.length) {
        cy.get(getTestSelector('FiatOnrampAnnouncement-close')).click()
      }
    })
    cy.get('#join-pool-button').click()
    cy.url().should('contain', '/add/ETH')
  })
})
