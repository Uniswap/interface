import { getTestSelector } from '../utils'

describe('Buy Crypto Modal', () => {
  it('should open and close', () => {
    cy.intercept('https://api.moonpay.com/v4/ip_address?apiKey=*', { fixture: 'moonpay/ip_address_valid.json' })
    cy.visit('/')

    // Open the fiat onramp modal
    cy.get(getTestSelector('buy-fiat-button')).click()
    cy.get(getTestSelector('fiat-onramp-modal')).should('be.visible')

    // Click on a location that should be outside the modal, which should close it
    cy.get('body').click(0, 100)
    cy.get(getTestSelector('fiat-onramp-modal')).should('not.exist')
  })

  it('should open and close, mobile viewport', () => {
    cy.intercept('https://api.moonpay.com/v4/ip_address?apiKey=*', { fixture: 'moonpay/ip_address_valid.json' })
    cy.viewport('iphone-6')
    cy.visit('/')

    // Open the fiat onramp modal
    cy.get(getTestSelector('buy-fiat-button')).click()
    cy.get(getTestSelector('fiat-onramp-modal')).should('be.visible')

    // Click on a location that should be outside the modal, which should close it
    cy.get('body').click(10, 10)
    cy.get(getTestSelector('fiat-onramp-modal')).should('not.exist')
  })

  it("should not open if the user's region is not supported", () => {
    cy.intercept('https://api.moonpay.com/v4/ip_address?apiKey=*', { fixture: 'moonpay/ip_address_invalid.json' })
    cy.visit('/')

    // Try to open the fiat onramp modal
    cy.get(getTestSelector('buy-fiat-button')).click()
    cy.get(getTestSelector('fiat-onramp-modal')).should('not.exist')
  })
})
