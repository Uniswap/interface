/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NativeModules, Platform } from 'react-native'

const { RNWalletConnect } = NativeModules

export const returnToPreviousApp = (): boolean => {
  // TOOD(MOB-1680): Implement return to previous app for Android
  if (Platform.OS === 'android') {
    return false
  }
  return RNWalletConnect.returnToPreviousApp()
}
