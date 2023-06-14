import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'

export enum ConnectionType {
  UNISWAP_WALLET = 'UNISWAP_WALLET',
  /** @deprecated - Use {@link UNISWAP_WALLET} instead. */
  UNIWALLET = 'UNIWALLET',
  INJECTED = 'INJECTED',
  COINBASE_WALLET = 'COINBASE_WALLET',
  WALLET_CONNECT = 'WALLET_CONNECT',
  WALLET_CONNECT_V2 = 'WALLET_CONNECT_V2',
  NETWORK = 'NETWORK',
  GNOSIS_SAFE = 'GNOSIS_SAFE',
}

export interface Connection {
  getName(): string
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
  getIcon?(isDarkMode: boolean): string
  shouldDisplay(): boolean
  overrideActivate?: () => boolean
  isNew?: boolean
}
