import { UniswapState } from 'uniswap/src/state/uniswapReducer'

// selectors

export const dismissedWarningTokensSelector = (
  state: UniswapState,
): {
  [currencyId: string]: boolean
} => state.tokens.dismissedWarningTokens
