import { NativeModules } from 'react-native'

const { RNWalletConnect } = NativeModules

export const connectToApp = (uri: string, account: string) => {
  RNWalletConnect.connect(uri, account)
}

export const disconnectFromApp = (sessionId: string, account: string) => {
  RNWalletConnect.disconnect(sessionId, account)
}
