import { SerializedTokenMap } from 'uniswap/src/features/tokens/slice/types'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

// selectors

export const dismissedWarningTokensSelector = (state: UniswapState): SerializedTokenMap =>
  state.tokens.dismissedTokenWarnings

export const dismissedBridgedAssetWarningsSelector = (state: UniswapState): SerializedTokenMap =>
  state.tokens.dismissedBridgedAssetWarnings

export const dismissedCompatibleAddressWarningsSelector = (state: UniswapState): SerializedTokenMap =>
  state.tokens.dismissedCompatibleAddressWarnings
