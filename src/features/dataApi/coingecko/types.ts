// Order by keys supported by Coingecko
// Other keys (e.g. % change) must be sorted locally
export enum CoingeckoOrderBy {
  GeckoAsc = 'gecko_asc',
  GeckoDesc = 'gecko_desc',
  IdAsc = 'id_asc',
  IdDesc = 'id_desc',
  MarketCapAsc = 'market_cap_asc',
  MarketCapDesc = 'market_cap_desc',
  VolumeAsc = 'volume_asc',
  VolumeDesc = 'volume_desc',
}

export enum ClientSideOrderBy {
  PriceChangePercentage24hAsc = 'price_change_percentage_24h_asc',
  PriceChangePercentage24hDesc = 'price_change_percentage_24h_desc',
}

export type GetCoinsMarketsResponse = Nullable<CoingeckoMarketCoin[]>
export type GetCoinsListResponse = { [coinId: string]: CoingeckoListCoin }
export type GetCoinsSearchResponse = Nullable<{ coins: CoingeckoSearchCoin[] }>

/** Coin info representation in Coingecko market lists  */
export interface CoingeckoMarketCoin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number | null
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number | null
  low_24h: number | null
  price_change_24h: number | null
  price_change_percentage_24h: number | null
  market_cap_change_24h: number | null
  market_cap_change_percentage_24h: number | null
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: Date
  atl: number
  atl_change_percentage: number
  atl_date: Date
  last_updated: Date
}

/** Coin info representation in Coingecko Token Lists */
export interface CoingeckoListCoin {
  id: string
  symbol: string
  name: string
  platforms: { [name: string]: Nullable<string> }
}

/**  Coin info representation in Coingecko Search lists */
export interface CoingeckoSearchCoin {
  id: string
  name: string
  symbol: string
  market_cap_rank: number
  thumb: string
  large: string
}
