import { NftActivityType, NftStandard, OrderStatus } from 'graphql/data/__generated__/types-and-hooks'

import { Markets, Rarity, TokenType } from '../common'
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

export enum UniformAspectRatios {
  unset,
  square,
}

export type UniformAspectRatio = UniformAspectRatios | number

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

export interface TokenRarity {
  rank: number
  score: number
  source: string
}

export interface TokenMetadata {
  name?: string
  imageUrl?: string
  smallImageUrl?: string
  metadataUrl?: string
  rarity?: TokenRarity | Rarity
  suspiciousFlag?: boolean
  standard?: TokenType | NftStandard
}

// TODO when deprecating activity query, remove all outdated types (former in optional fields)
export interface ActivityEvent {
  collectionAddress?: string
  tokenId?: string
  tokenMetadata?: TokenMetadata
  eventType?: NftActivityType
  marketplace?: Markets | string
  fromAddress?: string
  toAddress?: string
  transactionHash?: string
  orderStatus?: OrderStatus
  price?: string
  symbol?: string
  quantity?: number
  url?: string
  eventTimestamp?: number
}
