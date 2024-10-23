/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NativeModules } from 'react-native'
import { isAndroid } from 'utilities/src/platform'

const { RNWalletConnect, RedirectToSourceApp } = NativeModules

export const returnToPreviousApp = async (): Promise<boolean> => {
  if (isAndroid) {
    return RedirectToSourceApp.moveAppToBackground()
  }
  return RNWalletConnect.returnToPreviousApp()
}
