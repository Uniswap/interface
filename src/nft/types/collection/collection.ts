import { Markets, TokenType } from '../common'
export interface AssetPayload {
  filters: {
    traits?: Record<string, string[]>
    address: string
    currentEthPrice?: {
      $gte?: number
      $lte?: number
    }
    numTraits?: { traitCount: string }[]
    name?: string
    searchText?: string
    notForSale?: boolean
    tokenId?: string
  }
  fields?: Record<string, number>
  limit: number
  offset?: number
  sort?: CollectionSort
  markets?: string[]
}

export interface CollectionInfoForAsset {
  collectionDescription?: string | null
  collectionImageUrl?: string
  collectionName?: string
  isVerified?: boolean
  totalSupply?: number
  discordUrl?: string
  twitterUrl?: string
  externalUrl?: string
}

export type CollectionSort = Record<
  string,
  'asc' | 'desc' | 1 | -1 | { $gte?: string | number; $lte?: string | number } | string | number
>

export enum UniformHeights {
  unset,
  notUniform,
}

export type UniformHeight = UniformHeights | number

export enum ActivityEventType {
  Listing = 'LISTING',
  Sale = 'SALE',
  CancelListing = 'CANCEL_LISTING',
  Transfer = 'TRANSFER',
}

export enum ActivityEventTypeDisplay {
  'LISTING' = 'Listed',
  'SALE' = 'Sold',
  'TRANSFER' = 'Transferred',
  'CANCEL_LISTING' = 'Cancellation',
}

export enum OrderStatus {
  VALID = 'VALID',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface ActivityFilter {
  collectionAddress?: string
  eventTypes?: ActivityEventType[]
  marketplaces?: Markets[]
  token_id?: string
}

export interface ActivityEventResponse {
  events: ActivityEvent[]
  cursor?: string
}

export interface TokenRarity {
  rank: number
  score: number
  source: string
}

export interface TokenMetadata {
  name: string
  imageUrl: string
  smallImageUrl: string
  metadataUrl: string
  rarity: TokenRarity
  suspiciousFlag: boolean
  suspiciousFlaggedBy: string
  standard: TokenType
}

export interface ActivityEvent {
  collectionAddress: string
  tokenId?: string
  tokenMetadata?: TokenMetadata
  eventType: ActivityEventType
  marketplace?: Markets
  fromAddress: string
  toAddress?: string
  transactionHash?: string
  orderHash?: string
  orderStatus?: OrderStatus
  price?: string
  symbol?: string
  quantity?: number
  auctionType?: string
  url?: string
  eventTimestamp?: number
}
