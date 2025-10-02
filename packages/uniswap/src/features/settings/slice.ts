import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { getCurrentLanguageFromNavigator } from 'uniswap/src/features/language/utils'
import { WALLET_TESTNET_CONFIG } from 'uniswap/src/features/telemetry/constants'
import { isWebApp } from 'utilities/src/platform'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { analytics } from 'utilities/src/telemetry/analytics/analytics'

export interface UserSettingsState {
  currentLanguage: Language
  currentCurrency: FiatCurrency
  hideSmallBalances: boolean
  hideSpamTokens: boolean
  isTestnetModeEnabled?: boolean
  hapticsEnabled: boolean
}

export const initialUserSettingsState: UserSettingsState = {
  currentLanguage: isWebApp ? getCurrentLanguageFromNavigator() : Language.English,
  currentCurrency: FiatCurrency.UnitedStatesDollar,
  hideSmallBalances: true,
  hideSpamTokens: true,
  isTestnetModeEnabled: false,
  hapticsEnabled: true,
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
    /**
     * IMPORTANT: minimize and thoroughly vet every usage of this action so that testnets are **never** unintentionally toggled on
     */
    setIsTestnetModeEnabled: (state, { payload }: PayloadAction<boolean>) => {
      state.isTestnetModeEnabled = payload
      analytics.setTestnetMode(payload, WALLET_TESTNET_CONFIG)
    },
    setHapticsEnabled: (state, { payload }: PayloadAction<boolean>) => {
      state.hapticsEnabled = payload
    },
    resetSettings: () => initialUserSettingsState,
  },
})

export const {
  setHideSmallBalances,
  setHideSpamTokens,
  setCurrentLanguage,
  setCurrentFiatCurrency,
  setIsTestnetModeEnabled,
  setHapticsEnabled,
} = slice.actions

export const userSettingsReducer = slice.reducer
