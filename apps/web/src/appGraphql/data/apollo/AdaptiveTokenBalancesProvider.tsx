import { createAdaptiveRefetchContext } from 'appGraphql/data/apollo/AdaptiveRefetch'
import { GraphQLApi } from '@universe/api'

const {
  Provider: AdaptiveTokenBalancesProvider,
  useQuery: useTokenBalancesQuery,
  PrefetchWrapper: PrefetchBalancesWrapper,
} = createAdaptiveRefetchContext<GraphQLApi.PortfolioBalancesQueryResult>()

export { AdaptiveTokenBalancesProvider, PrefetchBalancesWrapper, useTokenBalancesQuery }
