import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/monitoredSagas'
import { cloudBackupReducer } from 'src/features/CloudBackup/cloudBackupSlice'
import { passwordLockoutReducer } from 'src/features/CloudBackup/passwordLockoutSlice'
import { biometricSettingsReducer } from 'src/features/biometrics/slice'
import { modalsReducer } from 'src/features/modals/modalSlice'
import { pushNotificationsReducer } from 'src/features/notifications/slice'
import { tweaksReducer } from 'src/features/tweaks/slice'
import { walletConnectReducer } from 'src/features/walletConnect/walletConnectSlice'
import { walletPersistedStateList, walletReducers } from 'wallet/src/state/walletReducer'

const mobileReducers = {
  ...walletReducers,
  biometricSettings: biometricSettingsReducer,
  cloudBackup: cloudBackupReducer,
  modals: modalsReducer,
  passwordLockout: passwordLockoutReducer,
  pushNotifications: pushNotificationsReducer,
  saga: monitoredSagaReducers,
  tweaks: tweaksReducer,
  walletConnect: walletConnectReducer,
} as const

export const mobileReducer = combineReducers(mobileReducers)

export const mobilePersistedStateList: Array<keyof typeof mobileReducers> = [
  ...walletPersistedStateList,
  'biometricSettings',
  'passwordLockout',
  'tweaks',
  'cloudBackup',
  'pushNotifications',
]

export type MobileState = ReturnType<typeof mobileReducer>
