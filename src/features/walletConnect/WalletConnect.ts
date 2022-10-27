import { NativeModules } from 'react-native'
import { ALL_SUPPORTED_CHAIN_IDS } from 'src/constants/chains'

const { RNWalletConnect } = NativeModules

export const initializeWalletConnect = () => {
  RNWalletConnect.initialize(ALL_SUPPORTED_CHAIN_IDS)
}

export const reconnectAccountSessions = () => {
  RNWalletConnect.reconnectAccountSessions()
}

export const connectToApp = (uri: string) => {
  RNWalletConnect.connect(uri)
}

export const disconnectFromApp = (topic: string) => {
  RNWalletConnect.disconnect(topic)
}

export const settlePendingSession = (chainId: number, account: string, approved: boolean) => {
  RNWalletConnect.settlePendingSession(chainId, account, approved)
}

export const changeChainId = (topic: string, chainId: number) => {
  RNWalletConnect.changeChainId(topic, chainId)
}

export const rejectRequest = (requestInternalId: string) => {
  RNWalletConnect.rejectRequest(requestInternalId)
}

export const confirmSwitchChainRequest = (requestInternalId: string) => {
  RNWalletConnect.confirmSwitchChainRequest(requestInternalId)
}

export const sendSignature = (requestInternalId: string, signature: string) => {
  RNWalletConnect.sendSignature(requestInternalId, signature)
}

export const isValidWCUrl = (uri: string) => {
  return RNWalletConnect.isValidWCUrl(uri)
}

export const disconnectWCForAccount = (account: string) => {
  return RNWalletConnect.disconnectAllForAccount(account)
}
