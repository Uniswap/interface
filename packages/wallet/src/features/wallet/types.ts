import { TokenSortableField } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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

export type DisplayName = {
  name: string
  type: DisplayNameType
}

export enum DisplayNameType {
  Address,
  ENS,
  Local,
  Unitag,
}
