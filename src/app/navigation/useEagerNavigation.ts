import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/core'
import { useCallback, useEffect } from 'react'
import {
  GraphQLTaggedNode,
  PreloadedQuery,
  PreloadFetchPolicy,
  usePreloadedQuery,
  useQueryLoader,
} from 'react-relay'
import { OperationType } from 'relay-runtime'
import { navigationRef } from 'src/app/navigation/NavigationContainer'
import { navigate as rootNavigate } from 'src/app/navigation/rootNavigation'
import { RootParamList } from 'src/app/navigation/types'
import { PollingInterval } from 'src/constants/misc'
import { Screens } from 'src/screens/Screens'
/**
 * Utility hook to preload a given query and navigate to a given screen with params.
 *
 * @example
 *  function MyTokenRow({ currencyId }) {
 *    const { registerNavigationIntent, preloadedNavigate } = useEagerNavigation(tokenDetailsQuery)
 *
 *    const onPressIn = () => registerNavigationIntent({ currencyId })
 *    const onPress = () => preloadedNavigate(Screens.TokenDetails, { currencyId })
 *
 *    return <Button onPressIn={onPressIn} onPress={onPress} />
 *  }
 */
export function useEagerNavigation<Q extends OperationType>(
  query: GraphQLTaggedNode,
  pollingInterval?: PollingInterval,
  /**
   * Without defining this fetch policy, relay will only reference the cache on the
   * polling interval. To force a new network request on each poll default to store-and-network.
   * Can override this value if needed.
   */
  fetchPolicy: PreloadFetchPolicy = 'store-and-network'
) {
  const { navigate } = useNavigation<any>()

  const [preloadedQuery, load] = useQueryLoader<Q>(query)

  const registerNavigationIntent = useCallback(
    (params: Q['variables']) => {
      load(params, {
        networkCacheConfig: {
          poll: pollingInterval,
        },
        fetchPolicy,
      })
    },
    [fetchPolicy, load, pollingInterval]
  )

  const preloadedNavigate = useCallback(
    (screen: Screens, params: any) => {
      navigate(screen, {
        ...params,
        preloadedQuery: preloadedQuery?.isDisposed ? null : preloadedQuery,
      })
    },
    [navigate, preloadedQuery]
  )

  // `preloadedQuery` may be null right after creation. This updates `params` with the non-null `preloadedQuery`
  // when it becomes set.
  useEffect(() => {
    if (!preloadedQuery) return
    navigationRef.dispatch(CommonActions.setParams({ preloadedQuery }))
  }, [preloadedQuery])

  return { registerNavigationIntent, preloadedNavigate }
}

// same functionality as above except this uses the root navigation object
// to be used by components that are not part of a NavStack, like the QR code scanner
export function useEagerRootNavigation<Q extends OperationType>(
  screen: keyof RootParamList,
  query: GraphQLTaggedNode,
  pollingInterval?: PollingInterval,
  // See above for fetch policy notes.
  fetchPolicy: PreloadFetchPolicy = 'store-and-network'
) {
  const [preloadedQuery, load] = useQueryLoader<Q>(query)

  const registerNavigationIntent = useCallback(
    (params: Q['variables']) => {
      load(params, {
        networkCacheConfig: {
          poll: pollingInterval,
        },
        fetchPolicy,
      })
    },
    [fetchPolicy, load, pollingInterval]
  )

  const preloadedNavigate = useCallback(
    (args: any, cb?: () => void) => {
      // @ts-ignore is ok if targetArgs.params is undefined
      const params = { ...(args.params ?? {}), preloadedQuery }
      rootNavigate(screen, { ...args, params: params })
      cb?.()
    },
    [preloadedQuery, screen]
  )

  // `preloadedQuery` may be null right after creation. This updates `params` with the non-null `preloadedQuery`
  // when it becomes set.
  useEffect(() => {
    if (!preloadedQuery) return
    navigationRef.dispatch(CommonActions.setParams({ preloadedQuery }))
  }, [preloadedQuery])

  return { registerNavigationIntent, preloadedNavigate }
}

/**
 * Simple wrapper around `usePreloadedQuery` that handles disposing
 * the query on screen blur.
 * Useful when `queryRef` is passed to a screen via parameters.
 */
export function useEagerLoadedQuery<T extends OperationType>(
  query: GraphQLTaggedNode,
  preloadedQuery: PreloadedQuery<T>
) {
  useFocusEffect(
    useCallback(() => {
      return () => {
        preloadedQuery?.dispose()
      }
    }, [preloadedQuery])
  )

  return usePreloadedQuery<T>(query, preloadedQuery)
}
