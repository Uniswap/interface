import { NativeModules } from 'react-native'
import { ALL_SUPPORTED_CHAIN_IDS } from 'src/constants/chains'

const { RNWalletConnect } = NativeModules

export const initializeWalletConnect = (): void => {
  RNWalletConnect.initialize(ALL_SUPPORTED_CHAIN_IDS)
}

export const reconnectAccountSessions = (): void => {
  RNWalletConnect.reconnectAccountSessions()
}

export const connectToApp = (uri: string): void => {
  RNWalletConnect.connect(uri)
}

export const disconnectFromApp = (topic: string): void => {
  RNWalletConnect.disconnect(topic)
}

export const settlePendingSession = (chainId: number, account: string, approved: boolean): void => {
  RNWalletConnect.settlePendingSession(chainId, account, approved)
}

export const changeChainId = (topic: string, chainId: number): void => {
  RNWalletConnect.changeChainId(topic, chainId)
}

export const rejectRequest = (requestInternalId: string): void => {
  RNWalletConnect.rejectRequest(requestInternalId)
}

export const confirmSwitchChainRequest = (requestInternalId: string): void => {
  RNWalletConnect.confirmSwitchChainRequest(requestInternalId)
}

export const sendSignature = (requestInternalId: string, signature: string): void => {
  RNWalletConnect.sendSignature(requestInternalId, signature)
}

export const isValidWCUrl = (uri: string): boolean => {
  return RNWalletConnect.isValidWCUrl(uri)
}

export const disconnectWCForAccount = (account: string): void => {
  return RNWalletConnect.disconnectAllForAccount(account)
}
