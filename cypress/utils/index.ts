export const getTestSelector = (selectorId: string) => `[data-cy=${selectorId}]`

// featureFlag is one of the enum values in the FeatureFlag enum inside of featureFlags/index
export const selectFeatureFlag = (featureFlag: string) => {
  cy.get(getTestSelector('menu')).click()
  cy.get(getTestSelector('feature-flags')).click()
  cy.get(`#${featureFlag}`).select('enabled')
  cy.reload()
}
