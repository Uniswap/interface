import { NftMarketplace, OrderStatus, OrderType } from 'graphql/data/nft/__generated__/DetailsQuery.graphql'

import { GenieCollection, PriceInfo, TokenType } from '../common'

export interface ListingMarket {
  name: string
  fee: number
  icon: string
}
export interface ListingWarning {
  marketplace: ListingMarket
  message: string
}

export interface SellOrder {
  address: string
  createdAt: number
  endAt: number
  id: string
  maker: string
  marketplace: NftMarketplace
  marketplaceUrl: string
  orderHash: string
  price: {
    currency: string
    value: number
  }
  quantity: number
  startAt: number
  status: OrderStatus
  tokenId: string
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
  imageUrl: string
  smallImageUrl: string
  notForSale: boolean
  animationUrl: string
  susFlag: boolean
  priceInfo: PriceInfo
  name: string
  tokenId: string
  asset_contract: {
    address: string
    schema_name: 'ERC1155' | 'ERC721' | string
    name: string
    description: string
    image_url: string
    payout_address: string
    tokenType: TokenType
  }
  collection: GenieCollection
  collectionIsVerified: boolean
  lastPrice: number
  floorPrice: number
  basisPoints: number
  listing_date: string
  date_acquired: string
  sellOrders: SellOrder[]
  floor_sell_order_price: number
  // Used for creating new listings
  expirationTime?: number
  marketAgnosticPrice?: number
  newListings?: Listing[]
  marketplaces?: ListingMarket[]
  listingWarnings?: ListingWarning[]
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
  images: string[]
  name: string
  status: ListingStatus
  callback?: () => Promise<void>
}

export interface ListingRow extends AssetRow {
  asset: WalletAsset
  marketplace: ListingMarket
  price?: number
}

export interface CollectionRow extends AssetRow {
  collectionAddress: string
  marketplace: ListingMarket
}

// Creating this as an enum and not boolean as we will likely have a success screen state to show
export enum ProfilePageStateType {
  VIEWING,
  LISTING,
}

export enum ListingResponse {
  TRY_AGAIN,
  SUCCESS,
}
