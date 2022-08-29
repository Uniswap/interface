export const testSelector = (selectorId: string) => `[data-testid=${selectorId}]`

// featureFlag is one of the enum values in the FeatureFlag enum inside of featureFlags/index
export const selectFeatureFlag = (featureFlag: string) => {
  cy.get(testSelector('menu')).click()
  cy.get(testSelector('feature-flags')).click()
  cy.get(`#${featureFlag}`).select('enabled')
  cy.reload()
}
