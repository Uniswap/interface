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
