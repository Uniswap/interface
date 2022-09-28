import { SellOrder } from '../sell'

export interface OpenSeaCollection {
  name: string
  slug: string
  image_url: string
  description: string
  external_url: string
  featured: boolean
  hidden: boolean
  safelist_request_status: string
  is_subject_to_whitelist: boolean
  large_image_url: string
  only_proxied_transfers: boolean
  payout_address: string
}

export interface OpenSeaAsset {
  id?: number
  image_url?: string
  image_preview_url?: string
  name?: string
  token_id?: string
  last_sale?: {
    total_price: string
  }
  asset_contract?: {
    address: string
    schema_name: 'ERC1155' | 'ERC721' | string
    asset_contract_type: string
    created_date: string
    name: string
    symbol: string
    description: string
    external_link: string
    image_url: string
    default_to_fiat: boolean
    only_proxied_transfers: boolean
    payout_address: string
  }
  collection?: OpenSeaCollection
}

interface OpenSeaUser {
  user?: null
  profile_img_url: string
  address: string
  config: string
}

export enum TokenType {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  Dust = 'Dust',
  Cryptopunk = 'Cryptopunk',
}

export interface PriceInfo {
  ETHPrice: string
  USDPrice: string
  baseAsset: string
  baseDecimals: string
  basePrice: string
}

export interface AssetSellOrder {
  ammFeePercent: number
  ethReserves: number
  tokenReserves: number
}

export interface Rarity {
  primaryProvider: string
  providers: { provider: string; rank: number; url: string; score: number }[]
}

export interface GenieAsset {
  id?: string // This would be a random id created and assigned by front end
  address: string
  notForSale: boolean
  collectionName: string
  collectionSymbol: string
  currentEthPrice: string
  currentUsdPrice: string
  imageUrl: string
  animationUrl: string
  marketplace: Markets
  name: string
  priceInfo: PriceInfo
  openseaSusFlag: boolean
  sellorders: SellOrder[]
  smallImageUrl: string
  tokenId: string
  tokenType: TokenType
  url: string
  totalCount?: number // The totalCount from the query to /assets
  amount?: number
  decimals?: number
  collectionIsVerified?: boolean
  rarity?: Rarity
  owner: string
  creator: OpenSeaUser
  externalLink: string
  traits?: {
    trait_type: string
    value: string
    display_type?: any
    max_value?: any
    trait_count: number
    order?: any
  }[]
}

export interface GenieCollection {
  collectionAddress: string
  address: string
  indexingStatus: string
  isVerified: boolean
  name: string
  description: string
  standard: string
  bannerImageUrl?: string
  floorPrice: number
  stats: {
    num_owners: number
    floor_price: number
    one_day_volume: number
    one_day_change: number
    one_day_floor_change: number
    banner_image_url: string
    total_supply: number
    total_listings: number
    total_volume: number
  }
  symbol: string
  traits: {
    trait_type: string
    trait_value: string
    trait_count: number
    floorSellOrder: PriceInfo
    floorPrice: number
  }[]
  numTraitsByAmount: { traitCount: number; numWithTrait: number }[]
  indexingStats: { openSea: { successfulExecutionDate: string; lastRequestedAt: string } }
  marketplaceCount?: { marketplace: string; count: number }[]
  imageUrl: string
  twitter?: string
  instagram?: string
  discordUrl?: string
  externalUrl?: string
  rarityVerified?: boolean
  isFoundation?: boolean
}

export enum Markets {
  NFT20 = 'nft20',
  NFTX = 'nftx',
  Opensea = 'opensea',
  Rarible = 'rarible',
  Uniswap = 'Uniswap',
  Uniswap_V2 = 'Uniswap_V2',
  SushiSwap = 'SushiSwap',
  SuperRare = 'superrare',
  KnownOrigin = 'knownorigin',
  WETH = 'weth',
  Cryptopunks = 'cryptopunks',
  CryptoPhunks = 'cryptophunks',
}

export enum ToolTipType {
  pool,
  sus,
}

// index starts at 1 for boolean reasons
export interface DropDownOption {
  displayText: string
  icon?: JSX.Element
  onClick: () => void
  reverseIndex?: number
  reverseOnClick?: () => void
}

export enum DetailsOrigin {
  COLLECTION = 'collection',
  PROFILE = 'profile',
  EXPLORE = 'explore',
}
