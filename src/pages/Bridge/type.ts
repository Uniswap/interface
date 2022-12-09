import { ChainId, Token } from '@kyberswap/ks-sdk-core'

export type MultiChainTokenInfo = {
  address: string
  symbol: string
  name: string
  price: number
  logoUrl: string
  decimals: number
  chainId: ChainId
  SwapFeeRatePerMillion: number
  BaseFeePercent: string
  MinimumSwapFee: string
  MaximumSwapFee: string
  destChains: DestChainInfo
  MaximumSwap: string
  MinimumSwap: string
  BigValueThreshold: string
  isFromLiquidity: boolean
  isLiquidity: boolean
  fromanytoken: Token
  anytoken: Token
  underlying: Token
  tokenType: string
  routerABI: string
  type: string
  pairid: string
  router: string
  DepositAddress: string
  isApprove: boolean
  spender: string
  sortId: number
  key: string // manual add
}

type DestChainInfo = {
  [chain: string]: {
    [key: string]: MultiChainTokenInfo
  }
}
