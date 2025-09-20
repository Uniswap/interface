import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { getCurrentLanguageFromNavigator } from 'uniswap/src/features/language/utils'
import { WALLET_TESTNET_CONFIG } from 'uniswap/src/features/telemetry/constants'
import { isInterface } from 'utilities/src/platform'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { analytics } from 'utilities/src/telemetry/analytics/analytics'

export interface UserSettingsState {
  currentLanguage: Language
  currentCurrency: FiatCurrency
  hideSmallBalances: boolean
  hideSpamTokens: boolean
  isTestnetModeEnabled?: boolean
  isCitreaOnlyEnabled?: boolean
  hapticsEnabled: boolean
}

export const initialUserSettingsState: UserSettingsState = {
  currentLanguage: isInterface ? getCurrentLanguageFromNavigator() : Language.English,
  currentCurrency: FiatCurrency.UnitedStatesDollar,
  hideSmallBalances: true,
  hideSpamTokens: true,
  isTestnetModeEnabled: true,
  isCitreaOnlyEnabled: true,
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
     * IMPORTANT: Testnet mode is now always enabled and cannot be toggled off
     */
    setIsTestnetModeEnabled: (state) => {
      // Always keep testnet mode enabled
      state.isTestnetModeEnabled = true
      analytics.setTestnetMode(true, WALLET_TESTNET_CONFIG)
    },
    setCitreaOnlyEnabled: (state, { payload }: PayloadAction<boolean>) => {
      state.isCitreaOnlyEnabled = payload
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
  setCitreaOnlyEnabled,
  setHapticsEnabled,
} = slice.actions

export const userSettingsReducer = slice.reducer
