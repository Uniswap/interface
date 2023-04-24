// Shares similarities with https://github.com/Uniswap/interface/blob/main/src/state/user/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from 'src/app/rootReducer'
import { CurrencyId } from 'src/utils/currencyId'

interface Tokens {
  dismissedWarningTokens: {
    [currencyId: CurrencyId]: boolean
  }
}

export const initialTokensState: Tokens = {
  dismissedWarningTokens: {},
}

const slice = createSlice({
  name: 'tokens',
  initialState: initialTokensState,
  reducers: {
    addDismissedWarningToken: (state, action: PayloadAction<{ currencyId: CurrencyId }>) => {
      const { currencyId } = action.payload
      state.dismissedWarningTokens[currencyId] = true
    },
    resetDismissedWarnings: (state) => {
      state.dismissedWarningTokens = {}
    },
    resetTokens: () => initialTokensState,
  },
})

export const { resetTokens, addDismissedWarningToken, resetDismissedWarnings } = slice.actions

export const tokensReducer = slice.reducer

// selectors
export const dismissedWarningTokensSelector = (
  state: RootState
): {
  [currencyId: string]: boolean
} => state.tokens.dismissedWarningTokens
