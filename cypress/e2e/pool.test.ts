import { getTestSelector } from '../utils'

describe('Pool', () => {
  beforeEach(() => {
    cy.visit('/pool').then(() => {
      cy.wait('@eth_blockNumber')
    })
  })

  it('add liquidity links to /add/ETH', () => {
    cy.get('body')
      .then((body) => {
        if (body.find(getTestSelector('FiatOnrampAnnouncement-close')).length > 0) {
          cy.get(getTestSelector('FiatOnrampAnnouncement-close')).click()
        }
      })
      .then(() => {
        cy.get('#join-pool-button')
          .click()
          .then(() => {
            cy.url().should('contain', '/add/ETH')
          })
      })
  })
})
