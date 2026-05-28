import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/monitoredSagas'
import { cloudBackupReducer } from 'src/features/CloudBackup/cloudBackupSlice'
import { passwordLockoutReducer } from 'src/features/CloudBackup/passwordLockoutSlice'
import { appStateReducer } from 'src/features/appState/appStateSlice'
import { biometricsReducer } from 'src/features/biometrics/biometricsSlice'
import { biometricSettingsReducer } from 'src/features/biometricsSettings/slice'
import { lockScreenReducer } from 'src/features/lockScreen/lockScreenSlice'
import { modalsReducer } from 'src/features/modals/modalSlice'
import { pushNotificationsReducer } from 'src/features/notifications/slice'
import { splashScreenReducer } from 'src/features/splashScreen/splashScreenSlice'
import { tweaksReducer } from 'src/features/tweaks/slice'
import { walletConnectReducer } from 'src/features/walletConnect/walletConnectSlice'
import { walletPersistedStateList, walletReducers } from 'wallet/src/state/walletReducer'

const mobileReducers = {
  ...walletReducers,
  biometrics: biometricsReducer,
  biometricSettings: biometricSettingsReducer,
  cloudBackup: cloudBackupReducer,
  modals: modalsReducer,
  passwordLockout: passwordLockoutReducer,
  pushNotifications: pushNotificationsReducer,
  saga: monitoredSagaReducers,
  tweaks: tweaksReducer,
  walletConnect: walletConnectReducer,
  appState: appStateReducer,
  splashScreen: splashScreenReducer,
  lockScreen: lockScreenReducer,
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
