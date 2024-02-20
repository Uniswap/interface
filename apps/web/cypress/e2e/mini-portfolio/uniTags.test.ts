import { FeatureFlag } from 'featureFlags'
import { getTestSelector } from '../../utils'

describe('Uni tags support', () => {
  beforeEach(() => {
    cy.visit('/swap', {
      featureFlags: [{ name: FeatureFlag.uniTags, value: true }],
    })
  })

  it('displays claim banner in account drawer', () => {
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.contains('Claim your Uniswap username')
  })

  it('displays large claim banner on page', () => {
    cy.get(getTestSelector('large-unitag-banner')).should('be.visible')
  })

  it('does not display claim banner on landing page', () => {
    cy.visit('/?intro=true', {
      featureFlags: [{ name: FeatureFlag.uniTags, value: true }],
    })
    cy.get(getTestSelector('large-unitag-banner')).should('not.be.visible')
  })

  it('opens modal and hides itself when accept button is clicked', () => {
    cy.get(getTestSelector('large-unitag-banner')).within(() => {
      cy.get(getTestSelector('unitag-banner-accept-button')).click()
    })
    cy.contains('Download the Uniswap app').should('exist')
    cy.get(getTestSelector('get-the-app-close-button')).click()
    cy.get(getTestSelector('large-unitag-banner')).should('not.be.visible')
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get('Claim your Uniswap username').should('not.exist')
  })

  it('hides itself when reject button is clicked', () => {
    cy.get(getTestSelector('large-unitag-banner')).within(() => {
      cy.get(getTestSelector('unitag-banner-reject-button')).click()
    })
    cy.get(getTestSelector('large-unitag-banner')).should('not.be.visible')
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get('Claim your Uniswap username').should('not.exist')
  })
})
