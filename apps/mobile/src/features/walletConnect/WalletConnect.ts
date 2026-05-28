import { isAndroid } from '@universe/environment'
/* oxlint-disable typescript/no-unsafe-return */
import { NativeModules } from 'react-native'

const { RNWalletConnect, RedirectToSourceApp } = NativeModules

export const returnToPreviousApp = async (): Promise<boolean> => {
  if (isAndroid) {
    return RedirectToSourceApp.moveAppToBackground()
  }
  return RNWalletConnect.returnToPreviousApp()
}
