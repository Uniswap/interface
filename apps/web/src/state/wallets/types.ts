import type { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface Wallet {
  walletName: string
  account: string
}
export interface ConnectedWalletsState {
  // Used to track wallets that have been connected by the user in current session, and remove them when deliberately disconnected.
  // Used to compute is_reconnect event property for analytics
  connectedWallets: Wallet[]
  switchingChain: UniverseChainId | false
}
