import { TokenSortableField } from 'src/data/__generated__/types-and-hooks'

export enum ClientTokensOrderBy {
  PriceChangePercentage24hAsc = 'PriceChangePercentage24hAsc',
  PriceChangePercentage24hDesc = 'PriceChangePercentage24hDesc',
}

export type TokensOrderBy = TokenSortableField | ClientTokensOrderBy
