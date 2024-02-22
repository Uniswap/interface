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
})
