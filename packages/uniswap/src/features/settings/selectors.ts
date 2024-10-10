import { Language } from 'uniswap/src/features/language/constants'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectWalletHideSmallBalancesSetting = (state: UniswapState): boolean =>
  state.userSettings.hideSmallBalances

export const selectWalletHideSpamTokensSetting = (state: UniswapState): boolean => state.userSettings.hideSpamTokens

export const selectCurrentLanguage = (state: UniswapState): Language => state.userSettings.currentLanguage

export const selectIsTestnetModeEnabled = (state: UniswapState): boolean =>
  state.userSettings.isTestnetModeEnabled ?? false
