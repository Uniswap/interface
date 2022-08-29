export const getTestSelector = (selectorId: string) => `[data-cy=${selectorId}]`

// 1. Go to featureFlags/index.tsx
// 2. Find the FeatureFlag enum
// 3. Copy the string that correspond with the flag you want to enable and pass it here
export const selectFeatureFlag = (featureFlag: string) => {
  cy.get(getTestSelector('menu')).click()
  cy.get(getTestSelector('feature-flags')).click()
  cy.get(`#${featureFlag}`).select('enabled')
  cy.reload()
}
