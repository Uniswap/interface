import { getTestSelector } from '../utils'

describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))

  it('add liquidity links to /add/ETH', () => {
    cy.get('body').then((body) => {
      if (body.find(getTestSelector('FiatOnrampAnnouncement-close')).length > 0) {
        cy.get(getTestSelector('FiatOnrampAnnouncement-close')).click()
      }
    })
    cy.get('#join-pool-button').click()
    cy.url().should('contain', '/add/ETH')
  })
})
