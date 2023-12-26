import { TokenSortableField } from 'wallet/src/data/__generated__/types-and-hooks'

export enum NFTViewType {
  Grid,
  Collection,
}

export enum ClientTokensOrderBy {
  PriceChangePercentage24hAsc = 'PriceChangePercentage24hAsc',
  PriceChangePercentage24hDesc = 'PriceChangePercentage24hDesc',
  Volume24hDesc = 'Volume24hDesc',
}

export type TokensOrderBy = TokenSortableField | ClientTokensOrderBy

export enum TokenMetadataDisplayType {
  MarketCap,
  Volume,
  TVL,
  Symbol,
}
