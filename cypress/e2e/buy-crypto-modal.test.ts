import { FeatureFlag } from '../../src/featureFlags'
import { getTestSelector } from '../utils'

describe('Buy Crypto Modal', () => {
  it('should open and close', () => {
    cy.visit('/', { featureFlags: [FeatureFlag.fiatOnRampButtonOnSwap] })

    // Open the fiat onramp modal
    cy.get(getTestSelector('buy-fiat-button')).click()
    cy.get(getTestSelector('fiat-onramp-modal')).should('be.visible')

    // Click on a location that should be outside the modal, which should close it
    cy.get('body').click(0, 100)
    cy.get(getTestSelector('fiat-onramp-modal')).should('not.exist')
  })

  it('should open and close, mobile viewport', () => {
    cy.viewport('iphone-6')
    cy.visit('/', { featureFlags: [FeatureFlag.fiatOnRampButtonOnSwap] })

    // Open the fiat onramp modal
    cy.get(getTestSelector('buy-fiat-button')).click()
    cy.get(getTestSelector('fiat-onramp-modal')).should('be.visible')

    // Click on a location that should be outside the modal, which should close it
    cy.get('body').click(10, 10)
    cy.get(getTestSelector('fiat-onramp-modal')).should('not.exist')
  })
})
