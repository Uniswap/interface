import { FeatureFlags } from "uniswap/src/features/gating/flags"

describe('Redirect', () => {
  it('should redirect to /vote/create-proposal when visiting /create-proposal', () => {
    cy.visit('/create-proposal')
    cy.url().should('match', /\/vote.uniswapfoundation.org/)
  })
  it('should redirect to /not-found when visiting nonexist url', () => {
    cy.visit('/none-exist-url')
    cy.url().should('match', /\/not-found/)
  })
})

describe('RedirectExplore', () => {
  it('should redirect from /tokens/ to /explore', () => {
    cy.visit('/tokens')
    cy.url().should('match', /\/explore/)

    cy.visit('/tokens/ethereum')
    cy.url().should('match', /\/explore\/tokens\/ethereum/)

    cy.visit('/tokens/optimism/NATIVE')
    cy.url().should('match', /\/explore\/tokens\/optimism\/NATIVE/)
  })
})

describe('Legacy Pool Redirects', () => {
  it('should redirect /pool to /positions', () => {
    cy.visit('/pool', {
      featureFlags: [{
        flag: FeatureFlags.V4Everywhere,
        value: true,
      }]
    })
    cy.url().should('match', /\/positions/)
  })

  it('should redirect /pool/:tokenId with chain param to /positions/v3/:chainName/:tokenId', () => {
    cy.visit('/pool/123?chain=mainnet', {
      featureFlags: [{
        flag: FeatureFlags.V4Everywhere,
        value: true,
      }]
    })
    cy.url().should('match', /\/positions\/v3\/ethereum\/123/)
  })
})
