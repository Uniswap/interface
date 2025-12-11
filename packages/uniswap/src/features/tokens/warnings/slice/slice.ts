import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  BasicTokenInfo,
  SerializedToken,
  SerializedTokenMap,
  TokenDismissInfo,
  TokenWarningDismissal,
} from 'uniswap/src/features/tokens/warnings/slice/types'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'

export interface TokensState {
  dismissedTokenWarnings: SerializedTokenMap<TokenWarningDismissal>
  dismissedBridgedAssetWarnings: SerializedTokenMap<TokenDismissInfo>
  dismissedCompatibleAddressWarnings: SerializedTokenMap<TokenDismissInfo>
}

export const initialTokensState: TokensState = {
  dismissedTokenWarnings: {},
  dismissedBridgedAssetWarnings: {},
  dismissedCompatibleAddressWarnings: {},
}

const slice = createSlice({
  name: 'tokens',
  initialState: initialTokensState,
  reducers: {
    dismissTokenWarning: (
      state,
      action: PayloadAction<{ token: SerializedToken | BasicTokenInfo; warning: TokenProtectionWarning }>,
    ) => {
      const { token, warning } = action.payload
      state.dismissedTokenWarnings[token.chainId] = state.dismissedTokenWarnings[token.chainId] || {}
      const normalizedAddress = getValidAddress(token)

      if (!normalizedAddress) {
        return
      }

      const existingWarnings = state.dismissedTokenWarnings[token.chainId]?.[normalizedAddress]?.warnings ?? []

      // biome-ignore lint/style/noNonNullAssertion: array access is safe here
      state.dismissedTokenWarnings[token.chainId]![normalizedAddress] = {
        token,
        // Ensure NonDefault is always included when dismissing a warning
        warnings: Array.from(new Set([...existingWarnings, warning, TokenProtectionWarning.NonDefault])),
      }
    },
    resetDismissedWarnings: (state) => {
      state.dismissedTokenWarnings = {}
    },
    dismissBridgedAssetWarning: (state, action: PayloadAction<{ token: SerializedToken | BasicTokenInfo }>) => {
      const { token } = action.payload
      state.dismissedBridgedAssetWarnings[token.chainId] = state.dismissedBridgedAssetWarnings[token.chainId] || {}
      const normalizedAddress = getValidAddress(token)
      if (normalizedAddress) {
        // biome-ignore lint/style/noNonNullAssertion: array access is safe here
        state.dismissedBridgedAssetWarnings[token.chainId]![normalizedAddress] = token
      }
    },
    resetDismissedBridgedAssetWarnings: (state) => {
      state.dismissedBridgedAssetWarnings = {}
    },
    dismissCompatibleAddressWarning: (state, action: PayloadAction<{ token: SerializedToken | BasicTokenInfo }>) => {
      const { token } = action.payload
      state.dismissedCompatibleAddressWarnings[token.chainId] =
        state.dismissedCompatibleAddressWarnings[token.chainId] || {}
      const normalizedAddress = getValidAddress(token)
      if (normalizedAddress) {
        // biome-ignore lint/style/noNonNullAssertion: array access is safe here
        state.dismissedCompatibleAddressWarnings[token.chainId]![normalizedAddress] = token
      }
    },
    resetDismissedCompatibleAddressWarnings: (state) => {
      state.dismissedCompatibleAddressWarnings = {}
    },
    resetTokens: () => initialTokensState,
  },
})

export const {
  resetTokens,
  dismissTokenWarning,
  resetDismissedWarnings,
  dismissBridgedAssetWarning,
  resetDismissedBridgedAssetWarnings,
  dismissCompatibleAddressWarning,
  resetDismissedCompatibleAddressWarnings,
} = slice.actions

export const tokensReducer = slice.reducer
