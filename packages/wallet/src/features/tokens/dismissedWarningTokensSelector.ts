import type { SharedState } from 'wallet/src/state/reducer'

// selectors

export const dismissedWarningTokensSelector = (
  state: SharedState
): {
  [currencyId: string]: boolean
} => state.tokens.dismissedWarningTokens
