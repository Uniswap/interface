import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectWalletHideSmallBalancesSetting = (state: UniswapState): boolean =>
  state.userSettings.hideSmallBalances

export const selectWalletHideSpamTokensSetting = (state: UniswapState): boolean => state.userSettings.hideSpamTokens
