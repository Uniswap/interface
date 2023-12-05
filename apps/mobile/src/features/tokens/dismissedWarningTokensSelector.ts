import type { MobileState } from 'src/app/reducer'

// selectors

export const dismissedWarningTokensSelector = (
  state: MobileState
): {
  [currencyId: string]: boolean
} => state.tokens.dismissedWarningTokens
