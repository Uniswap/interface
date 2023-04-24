import { getTestSelector } from '../utils'

describe('Buy Crypto Modal', () => {
  it('should open and close', () => {
    cy.visit('/')

    cy.get(getTestSelector('buy-fiat-button'))
      .click()
      .then(() => {
        cy.get(getTestSelector('fiat-onramp-modal')).should('be.visible')
      })

    cy.get('body')
      .click(0, 100)
      .then(() => {
        cy.get(getTestSelector('fiat-onramp-modal')).should('not.exist')
      })
  })

  it('should open and close, mobile viewport', () => {
    cy.viewport('iphone-6')
    cy.visit('/')

    cy.get(getTestSelector('buy-fiat-button'))
      .click()
      .then(() => {
        cy.get(getTestSelector('fiat-onramp-modal')).should('be.visible')
      })

    cy.get('body')
      .click(10, 10)
      .then(() => {
        cy.get(getTestSelector('fiat-onramp-modal')).should('not.exist')
      })
  })
})
