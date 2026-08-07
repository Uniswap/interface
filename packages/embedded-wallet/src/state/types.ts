export interface EmbeddedWalletState {
  walletAddress: string | null
  walletId: string | null
  chainId: number | null
  isConnected: boolean
}

export interface EmbeddedWalletStateHandle extends EmbeddedWalletState {
  setWalletAddress: (address: string | null) => void
  setWalletId: (walletId: string | null) => void
  setChainId: (chainId: number | null) => void
  setIsConnected: (isConnected: boolean) => void
  setEmbeddedWalletState: (updates: Partial<EmbeddedWalletState>) => void
}
