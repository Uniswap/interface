import type { WalletState } from 'wallet/src/state/walletReducer'

// selectors

export const dismissedWarningTokensSelector = (
  state: WalletState,
): {
  [currencyId: string]: boolean
} => state.tokens.dismissedWarningTokens
