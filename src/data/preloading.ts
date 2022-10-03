import { useMemo } from 'react'
import { useRelayEnvironment } from 'react-relay'
import { loadQuery, OfflineLoadQuery, QueryOptionsOffline } from 'react-relay-offline'
import { GraphQLTaggedNode, OperationType } from 'relay-runtime'
import { AppStackParamList } from 'src/app/navigation/types'
import { ChainId } from 'src/constants/chains'
import { Screens } from 'src/screens/Screens'
import { ActivityScreenQuery$variables } from 'src/screens/__generated__/ActivityScreenQuery.graphql'
import { TokenDetailsScreenQuery$variables } from 'src/screens/__generated__/TokenDetailsScreenQuery.graphql'
import { UserScreenQuery$variables } from 'src/screens/__generated__/UserScreenQuery.graphql'
import { toGraphQLChain } from 'src/utils/chainId'
import { currencyIdToAddress, currencyIdToChain } from 'src/utils/currencyId'

/** Helper to map from screen params to query variables. */
export const preloadMapping = {
  tokenDetails: ({
    currencyId,
  }: Omit<
    AppStackParamList[Screens.TokenDetails],
    'preloadedQuery'
  >): TokenDetailsScreenQuery$variables => {
    return {
      contract: {
        chain: toGraphQLChain(currencyIdToChain(currencyId) ?? ChainId.Mainnet) ?? 'ETHEREUM',
        address: currencyIdToAddress(currencyId),
      },
    }
  },
  activity: ({ address }: ActivityScreenQuery$variables) => {
    return {
      address,
    }
  },
  user: ({ address }: UserScreenQuery$variables) => {
    return {
      address,
    }
  },
}

export function useQueryLoader<Q extends OperationType>(
  query: GraphQLTaggedNode,
  // Used when queryRef will immediately be passed to `usePreloadedQuery` to avoid race condition
  initialConfig?: {
    params: Q['variables']
    options: QueryOptionsOffline
  }
) {
  const environment = useRelayEnvironment()

  const queryRef = useMemo(() => {
    const prefetch = loadQuery<Q>()

    const { preloadedQuery, load } = {
      preloadedQuery: prefetch as OfflineLoadQuery,
      load: (variables: Q['variables'], options: QueryOptionsOffline) =>
        prefetch.next(environment, query, variables, options),
    }

    // synchronously load query so cache is initialized by time it's used in usePreloadedQuery
    if (initialConfig) {
      load(initialConfig.params, initialConfig.options)
    }

    return { preloadedQuery: preloadedQuery, load: load }
  }, [environment, initialConfig, query])

  // TODO: this is causing problems on re-render
  // Figure out how to handle disposing queries
  // Relay's impl https://github.com/facebook/relay/blob/74630847604f1685e7f64669eaa89b190cf4ce31/packages/react-relay/relay-hooks/useQueryLoader.js#L65
  // useEffect(() => {
  //   return () => {
  //     preloadedQuery.dispose()
  //   }
  // }, [preloadedQuery])

  return queryRef
}
