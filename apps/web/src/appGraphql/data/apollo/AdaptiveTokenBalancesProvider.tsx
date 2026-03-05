import { GraphQLApi } from '@universe/api'
import { createAdaptiveRefetchContext } from '~/appGraphql/data/apollo/AdaptiveRefetch'

const {
  Provider: AdaptiveTokenBalancesProvider,
  useQuery: useTokenBalancesQuery,
  PrefetchWrapper: PrefetchBalancesWrapper,
} = createAdaptiveRefetchContext<GraphQLApi.PortfolioBalancesQueryResult>()

export { AdaptiveTokenBalancesProvider, PrefetchBalancesWrapper, useTokenBalancesQuery }
