import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'

export interface UserSettingsState {
  currentLanguage: Language
  currentCurrency: FiatCurrency
  hideSmallBalances: boolean
  hideSpamTokens: boolean
}

export const initialUserSettingsState: UserSettingsState = {
  currentLanguage: Language.English,
  currentCurrency: FiatCurrency.UnitedStatesDollar,
  hideSmallBalances: true,
  hideSpamTokens: true,
}

const slice = createSlice({
  name: 'userSettings',
  initialState: initialUserSettingsState,
  reducers: {
    setHideSmallBalances: (state, { payload }: PayloadAction<boolean>) => {
      state.hideSmallBalances = payload
    },
    setHideSpamTokens: (state, { payload }: PayloadAction<boolean>) => {
      state.hideSpamTokens = payload
    },
    setCurrentLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload
    },
    setCurrentFiatCurrency: (state, action: PayloadAction<FiatCurrency>) => {
      state.currentCurrency = action.payload
    },
    resetSettings: () => initialUserSettingsState,
  },
})

export const { setHideSmallBalances, setHideSpamTokens, setCurrentLanguage, setCurrentFiatCurrency } = slice.actions

export const updateLanguage = createAction<Language | null>('language/updateLanguage')
export const syncAppWithDeviceLanguage = (): ReturnType<typeof updateLanguage> => updateLanguage(null)

export const userSettingsReducer = slice.reducer
