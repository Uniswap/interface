export enum RemoteTokensOrderBy {
  MarketCapDesc = 'MarketCapDesc',
  GlobalVolumeDesc = 'GlobalVolumeDesc',
}

export enum LocalTokensOrderBy {
  PriceChangePercentage24hAsc = 'PriceChangePercentage24hAsc',
  PriceChangePercentage24hDesc = 'PriceChangePercentage24hDesc',
}

export type TokensOrderBy = RemoteTokensOrderBy | LocalTokensOrderBy
