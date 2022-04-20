/** Namespaces */

export enum Namespace {
  Address = 'address',
  Assets = 'assets',
}

export enum Scope {
  Transactions = 'transactions',
}

export type RequestBody = AddressRequestBody | AssetsRequestBody
type AnyPayload = { [key: string]: string | string[] }

interface AddressRequestBody {
  scope: [Scope]
  payload: AnyPayload
}

interface AssetsRequestBody {
  scope: [Scope]
  payload: AnyPayload
}
/** Models */

export type Price = {
  value: number
  relative_change_24h?: number
  changed_at: number
}

export type AssetType = string

export type Asset = {
  asset_code: string
  name: string
  symbol: string
  decimals: number
  type: AssetType
  icon_url?: string
  price?: Price
  is_displayable: boolean
  is_verified: boolean
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
  changes?: TransactionChange
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
}

type TransactionFee = { value: number; price: number }

type Direction = 'in' | 'out' | 'self'

type RDBTransactionType =
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
