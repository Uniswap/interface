export interface OpenseaResponse {
  next: string
  previous: string
  assets: OpenseaNFTAsset[]
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

export interface OpenseaCollection {
  address?: string
  asset_contract_type?: string
  buyer_fee_basis_points?: number
  collection?: {
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
  created_date?: string
  default_to_fiat?: boolean
  description?: string
  dev_buyer_fee_basis_points?: number
  dev_seller_fee_basis_points?: number
  external_link?: string
  image_url?: string
  name?: string
  nft_version?: string
  only_proxied_transfers?: boolean
  opensea_buyer_fee_basis_points?: number
  opensea_seller_fee_basis_points?: number
  opensea_version?: string
  owner?: string
  payout_address?: string
  schema_name?: string
  seller_fee_basis_points?: number
  symbol?: string
  total_supply?: string
}
