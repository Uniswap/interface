import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'

export interface FiatCurrencyState {
  currentCurrency: FiatCurrency
}

export const initialFiatCurrencyState: FiatCurrencyState = {
  currentCurrency: FiatCurrency.UnitedStatesDollar,
}

const slice = createSlice({
  name: 'fiatCurrencySettings',
  initialState: initialFiatCurrencyState,
  reducers: {
    setCurrentFiatCurrency: (state, action: PayloadAction<FiatCurrency>) => {
      state.currentCurrency = action.payload
    },
    resetSettings: () => initialFiatCurrencyState,
  },
})

export const { setCurrentFiatCurrency, resetSettings } = slice.actions

export const fiatCurrencySettingsReducer = slice.reducer
