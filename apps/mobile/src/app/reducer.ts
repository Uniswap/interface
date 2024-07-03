import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/saga'
import { cloudBackupReducer } from 'src/features/CloudBackup/cloudBackupSlice'
import { passwordLockoutReducer } from 'src/features/CloudBackup/passwordLockoutSlice'
import { biometricSettingsReducer } from 'src/features/biometrics/slice'
import { modalsReducer } from 'src/features/modals/modalSlice'
import { tweaksReducer } from 'src/features/tweaks/slice'
import { walletConnectReducer } from 'src/features/walletConnect/walletConnectSlice'
import { sharedReducers } from 'wallet/src/state/reducer'

const reducers = {
  ...sharedReducers,
  biometricSettings: biometricSettingsReducer,
  cloudBackup: cloudBackupReducer,
  modals: modalsReducer,
  passwordLockout: passwordLockoutReducer,
  saga: monitoredSagaReducers,
  tweaks: tweaksReducer,
  walletConnect: walletConnectReducer,
} as const

export const mobileReducer = combineReducers(reducers)

export type MobileState = ReturnType<typeof mobileReducer>
export type ReducerNames = keyof typeof reducers
