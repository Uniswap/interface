// eslint-disable-next-line import/no-unused-modules
export interface EthereumProvider {
  on?: (...args: any[]) => void
  removeListener?: (...args: any[]) => void
  autoRefreshOnNetworkChange?: boolean
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}
