import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BasicTokenInfo, SerializedToken, SerializedTokenMap } from 'uniswap/src/features/tokens/slice/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'

export interface TokensState {
  dismissedTokenWarnings: SerializedTokenMap
}

export const initialTokensState: TokensState = {
  dismissedTokenWarnings: {},
}

const slice = createSlice({
  name: 'tokens',
  initialState: initialTokensState,
  reducers: {
    dismissTokenWarning: (state, action: PayloadAction<{ token: SerializedToken | BasicTokenInfo }>) => {
      const {
        token: { chainId, address },
      } = action.payload
      const { token } = action.payload
      state.dismissedTokenWarnings[chainId] = state.dismissedTokenWarnings[chainId] || {}
      const lowercasedAddress = getValidAddress(address, false)
      if (lowercasedAddress) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state.dismissedTokenWarnings[chainId]![lowercasedAddress] = token
      }
    },
    resetDismissedWarnings: (state) => {
      state.dismissedTokenWarnings = {}
    },
    resetTokens: () => initialTokensState,
  },
})

export const { resetTokens, dismissTokenWarning, resetDismissedWarnings } = slice.actions

export const tokensReducer = slice.reducer
