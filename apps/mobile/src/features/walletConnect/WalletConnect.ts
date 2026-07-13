import { isAndroid } from '@universe/environment'
import { NativeModules } from 'react-native'

const { RNWalletConnect, RedirectToSourceApp } = NativeModules

export const returnToPreviousApp = async (): Promise<boolean> => {
  if (isAndroid) {
    // oxlint-disable-next-line typescript/no-unsafe-return -- NativeModules has no static types
    return RedirectToSourceApp.moveAppToBackground()
  }
  // oxlint-disable-next-line typescript/no-unsafe-return -- NativeModules has no static types
  return RNWalletConnect.returnToPreviousApp()
}
