import {
  PortfolioBalancesQueryResult,
  PortfolioTokenBalancePartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export type PortfolioToken = NonNullable<PortfolioTokenBalancePartsFragment['token']>

type PortfolioBalances = NonNullable<NonNullable<NonNullable<PortfolioBalancesQueryResult['data']>['portfolios']>[0]>

export type PortfolioBalance = NonNullable<NonNullable<NonNullable<PortfolioBalances['tokenBalances']>>[0]>
