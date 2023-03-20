import { NftMarketplace, NftStandard, OrderStatus, OrderType } from 'graphql/data/__generated__/types-and-hooks'

import { GenieCollection, PriceInfo } from '../common'

export interface ListingMarket {
  name: string
  fee: number
  icon: string
}

export interface SellOrder {
  address: string
  createdAt: number
  endAt?: number
  id: string
  maker: string
  marketplace: NftMarketplace
  marketplaceUrl: string
  orderHash?: string
  price: {
    currency?: string
    value: number
  }
  quantity: number
  startAt: number
  status: OrderStatus
  tokenId?: string
  type: OrderType
  protocolParameters: Record<string, unknown>
}

export interface Listing {
  price?: number
  marketplace: ListingMarket
  overrideFloorPrice?: boolean
}

export interface WalletAsset {
  id?: string
  imageUrl?: string
  smallImageUrl?: string
  notForSale: boolean
  animationUrl?: string
  susFlag?: boolean
  priceInfo?: PriceInfo
  name?: string
  tokenId?: string
  asset_contract: {
    address?: string
    name?: string
    description?: string
    image_url?: string
    payout_address?: string
    tokenType?: NftStandard
  }
  collection?: GenieCollection
  collectionIsVerified?: boolean
  lastPrice?: number
  floorPrice?: number
  basisPoints?: number
  listing_date?: string
  date_acquired?: string
  sellOrders?: SellOrder[]
  floor_sell_order_price?: number
  // Used for creating new listings
  expirationTime?: number
  marketAgnosticPrice?: number
  newListings?: Listing[]
  marketplaces?: ListingMarket[]
}

export interface WalletCollection {
  address: string
  name: string
  image: string
  floorPrice: number
  count: number
}

export enum ListingStatus {
  APPROVED = 'Approved',
  CONTINUE = 'Continue',
  DEFINED = 'Defined',
  FAILED = 'Failed',
  PAUSED = 'Paused',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
  SIGNING = 'Signing',
}

export interface AssetRow {
  images: (string | undefined)[]
  name?: string
  status: ListingStatus
  callback?: () => Promise<void>
}

export interface ListingRow extends AssetRow {
  asset: WalletAsset
  marketplace: ListingMarket
  price?: number
}

export interface CollectionRow extends AssetRow {
  collectionAddress?: string
  isVerified?: boolean
  marketplace: ListingMarket
  nftStandard?: NftStandard
}

// Creating this as an enum and not boolean as we will likely have a success screen state to show
export enum ProfilePageStateType {
  VIEWING,
  LISTING,
}
