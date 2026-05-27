import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { isMobileApp } from '@universe/environment'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { getCurrentLanguageFromNavigator } from 'uniswap/src/features/language/utils'
import { DEFAULT_DEVICE_ACCESS_TIMEOUT, type DeviceAccessTimeout } from 'uniswap/src/features/settings/constants'
import { WALLET_TESTNET_CONFIG } from 'uniswap/src/features/telemetry/constants'
import { getWalletDeviceLanguage } from 'uniswap/src/i18n/utils'
// oxlint-disable-next-line no-restricted-imports -- legacy import will be migrated
import { analytics } from 'utilities/src/telemetry/analytics/analytics'

export interface UserSettingsState {
  currentLanguage: Language
  currentCurrency: FiatCurrency
  hideSmallBalances: boolean
  hideSpamTokens: boolean
  hideReportedActivity?: boolean
  isTestnetModeEnabled?: boolean
  hapticsEnabled: boolean
  deviceAccessTimeout: DeviceAccessTimeout
  /** Wallet-level opt-in for the Network cost editor. `false` defers to the
   *  gas-service recommendation; `true` lets the user supply per-tx overrides. */
  enableCustomGasFeeEntry: boolean
}

export const initialUserSettingsState: UserSettingsState = {
  currentLanguage: isMobileApp ? getWalletDeviceLanguage() : getCurrentLanguageFromNavigator(),
  currentCurrency: FiatCurrency.UnitedStatesDollar,
  hideSmallBalances: true,
  hideSpamTokens: true,
  hideReportedActivity: true,
  isTestnetModeEnabled: false,
  hapticsEnabled: true,
  deviceAccessTimeout: DEFAULT_DEVICE_ACCESS_TIMEOUT,
  enableCustomGasFeeEntry: false,
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
    setHideReportedActivity: (state, { payload }: PayloadAction<boolean>) => {
      state.hideReportedActivity = payload
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
    setDeviceAccessTimeout: (state, { payload }: PayloadAction<DeviceAccessTimeout>) => {
      state.deviceAccessTimeout = payload
    },
    setEnableCustomGasFeeEntry: (state, { payload }: PayloadAction<boolean>) => {
      state.enableCustomGasFeeEntry = payload
    },
    resetUserSettings: () => initialUserSettingsState,
  },
})

export const {
  setHideSmallBalances,
  setHideSpamTokens,
  setHideReportedActivity,
  setCurrentLanguage,
  setCurrentFiatCurrency,
  setIsTestnetModeEnabled,
  setHapticsEnabled,
  setDeviceAccessTimeout,
  setEnableCustomGasFeeEntry,
  resetUserSettings,
} = slice.actions

export const userSettingsReducer = slice.reducer
