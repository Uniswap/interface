import { SerializedTokenMap } from 'uniswap/src/features/tokens/slice/types'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

// selectors

export const dismissedWarningTokensSelector = (state: UniswapState): SerializedTokenMap =>
  state.tokens.dismissedTokenWarnings
