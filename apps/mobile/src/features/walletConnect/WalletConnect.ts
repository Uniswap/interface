/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NativeModules } from 'react-native'

const { RNWalletConnect } = NativeModules

export const returnToPreviousApp = (): boolean => {
  return RNWalletConnect.returnToPreviousApp()
}
