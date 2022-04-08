import { NativeModules } from 'react-native'

const { RNWalletConnect } = NativeModules

export const connectToApp = (uri: string, account: string) => {
  RNWalletConnect.connect(uri, account)
}

export const disconnectFromApp = (sessionId: string, account: string) => {
  RNWalletConnect.disconnect(sessionId, account)
}

export const rejectRequest = (requestInternalId: string, account: string) => {
  RNWalletConnect.rejectRequest(requestInternalId, account)
}

export const sendSignature = (requestInternalId: string, signature: string, account: string) => {
  RNWalletConnect.sendSignature(requestInternalId, signature, account)
}
