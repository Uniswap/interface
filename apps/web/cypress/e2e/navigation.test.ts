import { FeatureFlag } from 'featureFlags'

import { getTestSelector } from '../utils'

describe('Navigation', () => {
  beforeEach(() => {
    cy.viewport(1400, 900)
    cy.visit('/?intro=true', {
      featureFlags: [{ name: FeatureFlag.landingPageV2, value: true }],
    })
  })
  it('displays Swap tab', () => {
    cy.get('nav').within(() => {
      cy.contains('Swap').should('be.visible').click()
    })
    cy.url().should('include', '/swap')
  })

  it('displays Tokens tab', () => {
    cy.get('nav').within(() => {
      cy.contains('Tokens').should('be.visible').click()
    })
    cy.url().should('include', '/tokens')
  })

  it('displays NFTs tab', () => {
    cy.get('nav').within(() => {
      cy.contains('NFTs').should('be.visible').click()
    })
    cy.url().should('include', '/nfts')
  })

  it('displays Pools tab', () => {
    cy.get('nav').within(() => {
      cy.contains('Pools').should('be.visible').click()
    })
    cy.url().should('include', '/pools')
  })

  describe('More Menu', () => {
    it('displays more menu for additional pages and resources', () => {
      cy.get('nav').within(() => {
        cy.get(getTestSelector('nav-more-button')).should('be.visible').click()
      })
    })

    it('moves pools tab to more menu on smaller screen sizes', () => {
      cy.viewport(1200, 900)
      cy.visit('/?intro=true', {
        featureFlags: [{ name: FeatureFlag.landingPageV2, value: true }],
      })
      cy.get('nav').within(() => {
        cy.contains('Pools').should('not.be.visible')
        cy.get(getTestSelector('nav-more-button')).should('be.visible').click()
        cy.get(getTestSelector('nav-more-menu')).within(() => {
          cy.contains('Pools').should('be.visible').click()
          cy.url().should('include', '/pools')
        })
      })
    })

    it('lets user open app download modal', () => {
      cy.get('nav')
        .within(() => {
          cy.get(getTestSelector('nav-more-button')).should('be.visible').click()
          cy.get(getTestSelector('nav-more-menu')).within(() => {
            cy.contains('Download Uniswap').should('be.visible').click()
          })
        })
        .then(() => {
          cy.contains('Download the Uniswap app').should('be.visible')
        })
    })
  })
})
