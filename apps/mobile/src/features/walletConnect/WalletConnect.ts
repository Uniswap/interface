/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NativeModules } from 'react-native'
import { isAndroid } from 'uniswap/src/utils/platform'

const { RNWalletConnect } = NativeModules

export const returnToPreviousApp = (): boolean => {
  // TOOD(MOB-1680): Implement return to previous app for Android
  if (isAndroid) {
    return false
  }
  return RNWalletConnect.returnToPreviousApp()
}
