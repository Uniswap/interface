import {
  SerializedTokenMap,
  TokenDismissInfo,
  TokenWarningDismissal,
} from 'uniswap/src/features/tokens/warnings/slice/types'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

// selectors

export const dismissedWarningTokensSelector = (state: UniswapState): SerializedTokenMap<TokenWarningDismissal> =>
  state.tokens.dismissedTokenWarnings

export const dismissedBridgedAssetWarningsSelector = (state: UniswapState): SerializedTokenMap<TokenDismissInfo> =>
  state.tokens.dismissedBridgedAssetWarnings

export const dismissedCompatibleAddressWarningsSelector = (state: UniswapState): SerializedTokenMap<TokenDismissInfo> =>
  state.tokens.dismissedCompatibleAddressWarnings
