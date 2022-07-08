/** Namespaces */

export enum Namespace {
  Address = 'address',
  Assets = 'assets',
}

export enum Scope {
  Transactions = 'transactions',
  Info = 'info',
}

export type RequestBody = AddressRequestBody | AssetsRequestBody

type PayloadBodyTypes = string | string[] | Partial<Record<OrderBy, 'asc' | 'desc'>> | number
type AnyPayload = { [key: string]: PayloadBodyTypes }

interface AddressRequestBody {
  scope: [Scope]
  payload: AnyPayload
}

interface AssetsRequestBody {
  scope: [Scope]
  payload: AnyPayload
}

// These map to fields in asset/address types
export enum OrderBy {
  MarketCap = 'market_cap',
  RelativeChange1D = 'relative_changes.1d',
  RelativeChange1M = 'relative_changes.1m',
  RelativeChange3M = 'relative_changes.3m',
}

/** Models */

export type Price = {
  value: number
  relative_change_24h?: number
  changed_at: number
}

export type AssetType = string

export type AssetData = {
  id: string
  asset_code: string
  name: string
  symbol: string
  decimals: number
  type?: AssetType
  icon_url?: string
  price?: Price
  is_displayable?: boolean
  is_verified?: boolean
}

export type Asset = {
  /**
   * TODO mark this as diff vs docs for data team
   */
  id: string
  asset_code: string
  name: string
  symbol: string
  decimals: number
  type?: AssetType
  icon_url?: string
  price?: Price
  is_displayable?: boolean
  is_verified?: boolean
}

export interface Collection {
  description: string
  icon_url: string
  name: string
}

export interface NFTAssetDetails {
  asset_code: string
  changed_at?: any
  collection: Collection
  contract_address: string
  detail: {
    meta?: any
    url: string
  }
  floor_price?: any
  interface: string
  is_displayable: boolean
  is_verified: boolean
  last_price?: any
  name: string
  preview: {
    meta?: any
    url: string
  }
  symbol: string
  tags?: any
  token_id: string
  total_floor_price?: any
  total_last_price?: any
  type: string
}

export interface NFTAsset {
  asset: NFTAssetDetails
  attributes: any[]
  collection: Collection
  description: string
  relevant_urls: {
    name: string
    url: string
  }[]
}

export type Transaction = {
  id: string
  type: RDBTransactionType
  protocol: string
  mined_at: number
  block_number: number
  status: TransactionStatus
  hash: string
  direction?: Direction
  address_from?: string
  address_to?: string
  contract?: string
  nonce?: number
  changes?: TransactionChange[]
  fee?: TransactionFee
  meta?: string
}

type TransactionChange = {
  asset: Asset
  value: number
  direction: Direction
  address_from: string
  address_to: string
  price?: number
  nft_asset?: NFTAsset | undefined | null
}

type TransactionFee = { value: number; price: number }

type Direction = 'in' | 'out' | 'self'

export type RDBTransactionType =
  | 'authorize'
  | 'borrow'
  | 'cancel'
  | 'claim'
  | 'deployment'
  | 'deposit'
  | 'execution'
  | 'receive'
  | 'repay'
  | 'send'
  | 'stake'
  | 'trade'
  | 'unstake'
  | 'withdraw'

type TransactionStatus = 'confirmed' | 'failed' | 'pending'
