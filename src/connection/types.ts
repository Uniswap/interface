import { ChainId } from '@uniswap/sdk-core'
import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'

export enum ConnectionType {
  UNISWAP_WALLET_V2 = 'UNISWAP_WALLET_V2',
  INJECTED = 'INJECTED',
  COINBASE_WALLET = 'COINBASE_WALLET',
  WALLET_CONNECT_V2 = 'WALLET_CONNECT_V2',
  NETWORK = 'NETWORK',
  GNOSIS_SAFE = 'GNOSIS_SAFE',
  DEPRECATED_NETWORK = 'DEPRECATED_NETWORK',
  EIP_6963_INJECTED = 'EIP_6963_INJECTED',
}

export function toConnectionType(value = ''): ConnectionType | undefined {
  if (Object.keys(ConnectionType).includes(value)) {
    return value as ConnectionType
  } else {
    return undefined
  }
}

export interface ProviderInfo {
  name: string
  icon?: string
  rdns?: string
}

export interface Connection {
  /** Optionally include isDarkMode when displaying icons that should change with current theme */
  getProviderInfo(isDarkMode?: boolean): ProviderInfo
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
  shouldDisplay(eip6963Enabled: boolean): boolean
  overrideActivate?: (chainId?: ChainId) => boolean
}
