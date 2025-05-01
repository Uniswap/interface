import { GenieCollection, PriceInfo } from 'nft/types/common'
import {
  Chain,
  NftMarketplace,
  NftStandard,
  OrderStatus,
  OrderType,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

interface ListingMarket {
  name: string
  fee: number
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

interface Listing {
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
  chain?: Chain
}

