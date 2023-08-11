import { combineReducers } from '@reduxjs/toolkit'
import { appearanceSettingsReducer } from 'src/features/appearance/slice'
import { biometricSettingsReducer } from 'src/features/biometrics/slice'
import { cloudBackupReducer } from 'src/features/CloudBackup/cloudBackupSlice'
import { passwordLockoutReducer } from 'src/features/CloudBackup/passwordLockoutSlice'
import { searchHistoryReducer } from 'src/features/explore/searchHistorySlice'
import { favoritesReducer } from 'src/features/favorites/slice'
import { modalsReducer } from 'src/features/modals/modalSlice'
import { telemetryReducer } from 'src/features/telemetry/slice'
import { tokensReducer } from 'src/features/tokens/tokensSlice'
import { tweaksReducer } from 'src/features/tweaks/slice'
import { walletConnectReducer } from 'src/features/walletConnect/walletConnectSlice'
import { sharedReducers } from 'wallet/src/state/reducer'
import { monitoredSagaReducers } from './saga'

const reducers = {
  ...sharedReducers,
  appearanceSettings: appearanceSettingsReducer,
  biometricSettings: biometricSettingsReducer,
  cloudBackup: cloudBackupReducer,
  favorites: favoritesReducer,
  modals: modalsReducer,
  passwordLockout: passwordLockoutReducer,
  saga: monitoredSagaReducers,
  searchHistory: searchHistoryReducer,
  telemetry: telemetryReducer,
  tokens: tokensReducer,
  tweaks: tweaksReducer,
  walletConnect: walletConnectReducer,
} as const
export const mobileReducer = combineReducers(reducers)

export type MobileState = ReturnType<typeof mobileReducer>
export type ReducerNames = keyof typeof reducers
