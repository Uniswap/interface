import { PortfolioTokenBalancePartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export type PortfolioToken = NonNullable<PortfolioTokenBalancePartsFragment['token']>
