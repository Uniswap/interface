// Shares similarities with https://github.com/Uniswap/interface/blob/main/src/state/user/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from 'src/app/rootReducer'
import { SerializedToken } from 'src/features/tokenLists/types'

interface Tokens {
  customTokens: {
    [chainId: number]: {
      [address: Address]: SerializedToken
    }
  }
  dismissedWarningTokens: {
    [chainId: number]: {
      [address: Address]: boolean
    }
  }
}

export const initialTokensState: Tokens = {
  customTokens: {},
  dismissedWarningTokens: {},
}

const slice = createSlice({
  name: 'tokens',
  initialState: initialTokensState,
  reducers: {
    addCustomToken: (state, action: PayloadAction<SerializedToken>) => {
      const newToken = action.payload
      state.customTokens[newToken.chainId] ||= {}
      state.customTokens[newToken.chainId][newToken.address] = newToken
    },
    removeCustomToken: (state, action: PayloadAction<{ address: Address; chainId: number }>) => {
      const { address, chainId } = action.payload
      if (!state.customTokens[chainId] || !!state.customTokens[chainId][address]) return
      delete state.customTokens[chainId][address]
    },
    addDismissedWarningToken: (
      state,
      action: PayloadAction<{ address: Address; chainId: number }>
    ) => {
      const { chainId, address } = action.payload
      state.dismissedWarningTokens ||= {}
      state.dismissedWarningTokens[chainId] ||= {}
      state.dismissedWarningTokens[chainId][address] = true
    },
    resetDismissedWarnings: (state) => {
      state.dismissedWarningTokens = {}
    },
    resetTokens: () => initialTokensState,
  },
})

export const {
  addCustomToken,
  removeCustomToken,
  resetTokens,
  addDismissedWarningToken,
  resetDismissedWarnings,
} = slice.actions

export const tokensReducer = slice.reducer

// selectors
export const dismissedWarningTokensSelector = (state: RootState) =>
  state.tokens.dismissedWarningTokens
