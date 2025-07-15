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
      const { token } = action.payload
      state.dismissedTokenWarnings[token.chainId] = state.dismissedTokenWarnings[token.chainId] || {}
      const normalizedAddress = getValidAddress(token)
      if (normalizedAddress) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state.dismissedTokenWarnings[token.chainId]![normalizedAddress] = token
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
