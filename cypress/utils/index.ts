import { FeatureFlag } from '../../src/featureFlags/flags/featureFlags'

export const getTestSelector = (selectorId: string) => `[data-testid=${selectorId}]`

export const selectFeatureFlag = (featureFlags: Array<FeatureFlag>) => {
  cy.get(getTestSelector('menu')).click()
  cy.get(getTestSelector('feature-flags')).click()
  featureFlags.forEach((featureFlag) => cy.get(`#${featureFlag}`).select('enabled'))
  cy.reload()
}
