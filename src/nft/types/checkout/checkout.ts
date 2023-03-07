import { ContractReceipt } from '@ethersproject/contracts'

import { GenieAsset, Markets, PriceInfo, TokenType } from '../common'

export interface UpdatedGenieAsset extends GenieAsset {
  updatedPriceInfo?: PriceInfo
  isUnavailable?: boolean
  orderSource?: 'api' | 'stored' | string
}

export enum RoutingActions {
  Buy = 'Buy',
  Sell = 'Sell',
  Swap = 'Swap',
}

export type SellItem = {
  id?: string
  symbol?: string
  name: string
  decimals: number
  address: string
  priceInfo: PriceInfo
  tokenType: TokenType
  tokenId: string
  amount: string // convert to BigNumber
  marketplace?: Markets
}

export type BuyItem = {
  id?: string
  symbol?: string
  name?: string
  decimals: number
  address: string
  priceInfo: PriceInfo
  tokenType: TokenType
  tokenId: string
  amount: string // convert to BigNumber
  marketplace: Markets
  collectionName?: string
  orderSource?: 'api' | 'stored' | string
}

export type RoutingItem = {
  action: RoutingActions
  marketplace: string
  amountIn: string
  assetIn: SellItem | PriceInfo
  amountOut: string
  assetOut: BuyItem | PriceInfo
}

export interface RouteResponse {
  valueToSend?: string
  route: RoutingItem[]
  data: any
  to: any
}

export interface TxResponse {
  nftsPurchased: UpdatedGenieAsset[]
  nftsNotPurchased: UpdatedGenieAsset[]
  txReceipt: ContractReceipt
}

export enum TxStateType {
  Success = 'Success',
  Denied = 'Denied',
  Invalid = 'Invalid',
  Failed = 'Failed',
  New = 'New',
  Signing = 'Signing',
  Confirming = 'Confirming',
}

export enum BagItemStatus {
  ADDED_TO_BAG = 'Added to bag',
  REVIEWED = 'Reviewed',
  REVIEWING_PRICE_CHANGE = 'REVIEWING_PRICE_CHANGE',
  UNAVAILABLE = 'UNAVAILABLE',
}

export type BagItem = {
  asset: UpdatedGenieAsset
  status: BagItemStatus
  inSweep?: boolean
}

export enum BagStatus {
  ADDING_TO_BAG = 'Adding to bag',
  FETCHING_ROUTE = 'Fetching route',
  IN_REVIEW = 'In review',
  WARNING = 'Warning',
  CONFIRM_REVIEW = 'Confirming review',
  FETCHING_FINAL_ROUTE = 'Fetching final route',
  CONFIRMING_IN_WALLET = 'Confirming in wallet',
  PROCESSING_TRANSACTION = 'Processing',
  CONFIRM_QUOTE = 'Confirm quote',
}
