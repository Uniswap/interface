import { ChainId } from '@kyberswap/ks-sdk-core'

export type TopToken = {
  chainId: ChainId
  address: string
  symbol: string
  name: string
  decimals: number
  marketCap: number
  logoURI: string
  isWhitelisted: boolean
}

export enum PairFactor {
  SUPER_STABLE = 1,
  STABLE = 2,
  NOMAL = 30,
  EXOTIC = 100,
}
