import { CommonActions, useNavigation } from '@react-navigation/core'
import { useCallback, useEffect } from 'react'
import { GraphQLTaggedNode, useQueryLoader } from 'react-relay'
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
  pollingInterval?: PollingInterval
) {
  const { navigate } = useNavigation<any>()

  const [preloadedQuery, load] = useQueryLoader<Q>(query)

  const registerNavigationIntent = useCallback(
    (params: Q['variables']) => {
      load(params, {
        networkCacheConfig: {
          poll: pollingInterval,
        },
      })
    },
    [load, pollingInterval]
  )

  const preloadedNavigate = useCallback(
    (screen: Screens, params: any) => {
      navigate(screen, {
        ...params,
        preloadedQuery,
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
  pollingInterval?: PollingInterval
) {
  const [preloadedQuery, load] = useQueryLoader<Q>(query)

  const registerNavigationIntent = useCallback(
    (params: Q['variables']) => {
      load(params, {
        networkCacheConfig: {
          poll: pollingInterval,
        },
      })
    },
    [load, pollingInterval]
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
