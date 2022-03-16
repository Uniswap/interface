export interface OpenseaNFTAssetResponse {
  next: string
  previous: string
  assets: OpenseaNFTAsset[]
}

export interface OpenseaNFTCollectionResponse {
  collection: OpenseaNFTCollection
}

export interface OpenseaNFTAsset {
  id: number
  num_sales: number
  background_color: string
  image_url: string
  image_preview_url: string
  image_thumbnail_url: string
  image_original_url: string
  animation_url: string
  animation_original_url: string
  name: string
  description: string
  external_link: string
  permalink: string
  owner: {
    user: {
      username: string
    }
    profile_img_url: string
    address: string
  }
  traits: [
    {
      trait_type: string
      value: string
      display_type: string
      max_value: string
      trait_count: string
    }
  ]
  collection: {
    banner_image_url: string
    chat_url?: string
    created_date: string
    default_to_fiat: boolean
    description: string
    dev_buyer_fee_basis_points: string
    dev_seller_fee_basis_points: string
    discord_url?: string
    display_data: {
      card_display_style: string
    }
    external_url: string
    featured: boolean
    featured_image_url: string
    hidden: boolean
    image_url: string
    instagram_username?: string
    is_subject_to_whitelist: boolean
    large_image_url: string
    medium_username?: string
    name: string
    only_proxied_transfers: boolean
    opensea_buyer_fee_basis_points: string
    opensea_seller_fee_basis_points: string
    payout_address: string
    require_email: boolean
    safelist_request_status: string
    short_description?: string
    slug: string
    telegram_url?: string
    twitter_username?: string
    wiki_url?: string
  }
}

export interface OpenseaNFTCollection {
  banner_image_url: string
  chat_url?: string
  created_date: string
  default_to_fiat: boolean
  description: string
  dev_buyer_fee_basis_points: string
  dev_seller_fee_basis_points: string
  discord_url?: string
  display_data: {
    card_display_style: string
  }
  external_url: string
  featured: boolean
  featured_image_url: string
  hidden: boolean
  image_url: string
  instagram_username?: string
  is_subject_to_whitelist: boolean
  large_image_url: string
  medium_username?: string
  name: string
  only_proxied_transfers: boolean
  opensea_buyer_fee_basis_points: string
  opensea_seller_fee_basis_points: string
  payout_address: string
  require_email: boolean
  safelist_request_status: string
  short_description?: string
  slug: string
  telegram_url?: string
  twitter_username?: string
  wiki_url?: string
  external_link?: string
  nft_version?: string
  opensea_version?: string
  owner?: string
  schema_name?: string
  seller_fee_basis_points?: number
  symbol?: string
  stats: {
    one_day_volume: number
    one_day_change: number
    one_day_sales: number
    one_day_average_price: number
    seven_day_volume: number
    seven_day_change: number
    seven_day_sales: number
    seven_day_average_price: number
    thirty_day_volume: number
    thirty_day_change: number
    thirty_day_sales: number
    thirty_day_average_price: number
    total_volume: number
    total_sales: number
    total_supply: number
    count: number
    num_owners: number
    average_price: number
    num_reports: number
    market_cap: number
    floor_price: number
  }
}
