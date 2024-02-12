import { FeatureFlag } from 'featureFlags'

describe('Redirect', () => {
  it('should redirect to /vote/create-proposal when visiting /create-proposal', () => {
    cy.visit('/create-proposal')
    cy.url().should('match', /\/vote\/create-proposal/)
  })
  it('should redirect to /not-found when visiting nonexist url', () => {
    cy.visit('/none-exist-url')
    cy.url().should('match', /\/not-found/)
  })
})

describe('RedirectExplore', () => {
  it('should redirect from /tokens/ to /explore under feature flag', () => {
    cy.visit('/tokens', {
      featureFlags: [{ name: FeatureFlag.infoExplore, value: true }],
    })
    cy.url().should('match', /\/explore/)

    cy.visit('/tokens/ethereum', {
      featureFlags: [{ name: FeatureFlag.infoExplore, value: true }],
    })
    cy.url().should('match', /\/explore\/tokens\/ethereum/)

    cy.visit('/tokens/optimism/NATIVE', {
      featureFlags: [{ name: FeatureFlag.infoExplore, value: true }],
    })
    cy.url().should('match', /\/explore\/tokens\/optimism\/NATIVE/)
  })
})
