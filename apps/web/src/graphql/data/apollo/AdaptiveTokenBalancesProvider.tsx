import { createAdaptiveRefetchContext } from 'graphql/data/apollo/AdaptiveRefetch'
import { PortfolioBalancesQueryResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const {
  Provider: AdaptiveTokenBalancesProvider,
  useQuery: useTokenBalancesQuery,
  PrefetchWrapper: PrefetchBalancesWrapper,
} = createAdaptiveRefetchContext<PortfolioBalancesQueryResult>()

export { AdaptiveTokenBalancesProvider, PrefetchBalancesWrapper, useTokenBalancesQuery }
