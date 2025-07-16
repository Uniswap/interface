/* eslint-disable @typescript-eslint/no-explicit-any */
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { SerializedTokenMap } from 'uniswap/src/features/tokens/slice/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'

// Mobile: 82
// Extension: 18
// Web: 21
export function unchecksumDismissedTokenWarningKeys(state: any): any {
  if (!state?.tokens?.dismissedTokenWarnings) {
    return state
  }

  const newDismissedWarnings: SerializedTokenMap = Object.entries(state.tokens.dismissedTokenWarnings).reduce(
    (acc, [chainId, warningsForChain]) => ({
      ...acc,
      [chainId]: Object.entries(warningsForChain as Record<string, unknown>).reduce((chainAcc, [address, warning]) => {
        const lowercasedAddress = getValidAddress({ address, withChecksum: false })
        return lowercasedAddress ? { ...chainAcc, [lowercasedAddress]: warning } : chainAcc
      }, {}),
    }),
    {},
  )

  return {
    ...state,
    tokens: {
      ...state.tokens,
      dismissedTokenWarnings: newDismissedWarnings,
    },
  }
}

// Mobile: 89
// Extension: 25
// Web: 25
export function removeThaiBahtFromFiatCurrency(state: any): any {
  const newState = { ...state }
  if (newState.userSettings.currentCurrency === 'THB') {
    newState.userSettings.currentCurrency = FiatCurrency.UnitedStatesDollar
  }
  return newState
}
