import { ChainId, Currency } from '@kyberswap/ks-sdk-core'

export enum LimitOrderStatus {
  // status from BE
  ACTIVE = 'active',
  OPEN = 'open',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELLING = 'cancelling',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  // custom status
  CANCELLED_FAILED = 'cancelled_failed',
}

export type LimitOrder = {
  id: number
  nonce: number
  chainId: ChainId
  makerAsset: string
  takerAsset: string
  makerAssetSymbol: string
  takerAssetSymbol: string
  makerAssetLogoURL: string
  takerAssetLogoURL: string
  makerAssetDecimals: number
  takerAssetDecimals: number
  makingAmount: string
  takingAmount: string
  filledMakingAmount: string
  filledTakingAmount: string
  status: LimitOrderStatus
  createdAt: number // timestamp in seconds
  expiredAt: number
  transactions: Array<{
    id: number
    txTime: number
    txHash: string
    makingAmount: string
    takingAmount: string
  }>
  // custom
  isSuccessful: boolean
  uuid: string
  txHash: string
}

export type RateInfo = {
  rate: string
  invertRate: string
  invert: boolean
}

export type ListOrderHandle = {
  refreshListOrder: () => void
}

export type CreateOrderParam = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  chainId: ChainId
  account: string | undefined
  inputAmount: string
  outputAmount: string
  expiredAt: number
  orderId?: number
  signature?: string
  salt?: string
}
