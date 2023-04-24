export const getTestSelector = (selectorId: string) => `[data-testid=${selectorId}]`

export const getTestSelectorStartsWith = (selectorId: string) => `[data-testid^=${selectorId}]`

// TODO: Remove this comment if you use the util.
// eslint-disable-next-line import/no-unused-modules
export const getClassContainsSelector = (selectorId: string) => `[class*=${selectorId}]`
