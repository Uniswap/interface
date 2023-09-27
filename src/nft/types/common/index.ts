import { MediaType, NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { SortBy } from 'nft/hooks'

import { SellOrder } from '../sell'

export enum TokenType {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  Dust = 'Dust',
  Cryptopunk = 'Cryptopunk',
}

export interface PriceInfo {
  ETHPrice: string
  USDPrice?: string
  baseAsset: string
  baseDecimals: string
  basePrice: string
}

export interface Rarity {
  primaryProvider: string
  providers?: { provider: string; rank?: number; url?: string; score?: number }[]
}

export interface Trait {
  trait_type: string
  trait_value: string
  display_type?: any
  max_value?: any
  trait_count?: number
  order?: any
}

export interface GenieAsset {
  id?: string // This would be a random id created and assigned by front end
  address: string
  notForSale?: boolean
  collectionName?: string
  collectionSymbol?: string
  imageUrl?: string
  animationUrl?: string
  mediaType?: MediaType
  marketplace?: Markets
  name?: string
  priceInfo: PriceInfo
  susFlag?: boolean
  sellorders?: SellOrder[]
  smallImageUrl?: string
  tokenId: string
  tokenType?: NftStandard
  totalCount?: number // The totalCount from the query to /assets
  collectionIsVerified?: boolean
  rarity?: Rarity
  ownerAddress?: string
  metadataUrl?: string
  creator: {
    address?: string
    profile_img_url?: string
  }
  traits?: Trait[]
}

export interface GenieCollection {
  address: string
  isVerified?: boolean
  name?: string
  description?: string
  standard?: string
  bannerImageUrl?: string
  stats?: {
    num_owners?: number
    floor_price?: number
    one_day_volume?: number
    one_day_change?: number
    one_day_floor_change?: number
    banner_image_url?: string
    total_supply?: number
    total_listings?: number
    total_volume?: number
  }
  traits?: Record<string, Trait[]>
  marketplaceCount?: { marketplace: string; count: number; floorPrice: number }[]
  imageUrl: string
  twitterUrl?: string
  instagram?: string
  discordUrl?: string
  externalUrl?: string
  rarityVerified?: boolean
  isFoundation?: boolean
}

export enum Markets {
  LooksRare = 'looksrare',
  X2Y2 = 'x2y2',
  NFT20 = 'nft20',
  NFTX = 'nftx',
  Opensea = 'opensea',
  Rarible = 'rarible',
  Sudoswap = 'sudoswap',
  Cryptopunks = 'cryptopunks',
  Gem = 'gem',
  Foundation = 'foundation',
  Zora = 'zora',
  Blur = 'blur',
  Ensvision = 'ensvision',
}

export const isPooledMarket = (market?: Markets): boolean => {
  if (!market) return false
  return market === Markets.NFTX || market === Markets.NFT20 || market === Markets.Sudoswap
}

// index starts at 1 for boolean reasons
export interface DropDownOption {
  displayText: string
  onClick: () => void
  reverseIndex?: number
  reverseOnClick?: () => void
  sortBy?: SortBy
  isSelected?: boolean
}

export enum DetailsOrigin {
  COLLECTION = 'collection',
  PROFILE = 'profile',
  EXPLORE = 'explore',
}
