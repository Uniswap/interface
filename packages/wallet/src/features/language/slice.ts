import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Language } from 'wallet/src/features/language/constants'

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

export const languageSettingsReducer = slice.reducer
