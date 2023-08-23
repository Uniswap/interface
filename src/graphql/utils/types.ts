import { Currency } from '@pollum-io/sdk-core'

export enum Chain {
  Arbitrum = 'ARBITRUM',
  Avalanche = 'AVALANCHE',
  Bnb = 'BNB',
  Celo = 'CELO',
  Ethereum = 'ETHEREUM',
  EthereumGoerli = 'ETHEREUM_GOERLI',
  EthereumSepolia = 'ETHEREUM_SEPOLIA',
  Optimism = 'OPTIMISM',
  Polygon = 'POLYGON',
  UnknownChain = 'UNKNOWN_CHAIN',
}

type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  AWSJSON: any
}

type InputMaybe<T> = T

export type ContractInput = {
  address?: InputMaybe<Scalars['String']>
  chain: Chain
}

export type TokenAmount = {
  id: string
  value: string
  currency: Currency
}
