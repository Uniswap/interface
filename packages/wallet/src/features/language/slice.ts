import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Language } from 'wallet/src/features/language/constants'
import { WalletState } from 'wallet/src/state/walletReducer'

export interface LanguageState {
  currentLanguage: Language
}

export const initialLanguageState: LanguageState = {
  currentLanguage: Language.English,
}

const slice = createSlice({
  name: 'languageSettings',
  initialState: initialLanguageState,
  reducers: {
    setCurrentLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload
    },
    resetSettings: () => initialLanguageState,
  },
})

export const { setCurrentLanguage, resetSettings } = slice.actions

export const updateLanguage = createAction<Language | null>('language/updateLanguage')
export const syncAppWithDeviceLanguage = (): ReturnType<typeof updateLanguage> => updateLanguage(null)

export const selectCurrentLanguage = (state: WalletState): Language => state.languageSettings.currentLanguage

export const languageSettingsReducer = slice.reducer
