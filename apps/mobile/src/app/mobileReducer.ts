import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/monitoredSagas'
import { appStateReducer } from 'src/features/appState/appStateSlice'
import { biometricsReducer } from 'src/features/biometrics/biometricsSlice'
import { biometricSettingsReducer } from 'src/features/biometricsSettings/slice'
import { passwordLockoutReducer } from 'src/features/CloudBackup/passwordLockoutSlice'
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
  'pushNotifications',
]

export type MobileState = ReturnType<typeof mobileReducer>
