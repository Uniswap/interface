import { useNavigation } from '@react-navigation/core'
import { useCallback, useEffect, useState } from 'react'
import { GraphQLTaggedNode, useQueryLoader } from 'react-relay'
import { OperationType } from 'relay-runtime'
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

  const [preloadedQuery, loadQuery] = useQueryLoader<Q>(query)

  // Stores params for the next navigation action
  const [targetScreen, setTargetScreen] = useState<Screens | null>(null)
  const [targetParams, setTargetParams] = useState<Object>({})

  function registerNavigationIntent(params: Q['variables']) {
    loadQuery(params, {
      networkCacheConfig: {
        poll: pollingInterval,
      },
    })
  }

  function preloadedNavigate(screen: Screens, params: any) {
    setTargetScreen(screen)
    setTargetParams(params)
  }

  // HACK: `preloadedQuery` will be `null` for a few cycles after calling `loadQuery` which
  // means we cannot yet navigate to that screen as it won't get updates.
  // Other possible solutions: store preloadedQuery outside of this hook (redux?)
  useEffect(() => {
    if (!preloadedQuery || !targetScreen) return

    navigate(targetScreen, {
      ...targetParams,
      preloadedQuery,
    })

    setTargetScreen(null)
  }, [navigate, preloadedQuery, targetParams, targetScreen])

  return { registerNavigationIntent, preloadedNavigate }
}

// same functionality as above except this uses the root navigation object
// to be used by components that are not part of a NavStack, like the QR code scanner
export function useEagerRootNavigation<Q extends OperationType>(
  screen: keyof RootParamList,
  query: GraphQLTaggedNode,
  pollingInterval?: PollingInterval
) {
  const [preloadedQuery, loadQuery] = useQueryLoader<Q>(query)

  // Stores params for the next navigation action
  const [targetArgs, setTargetArgs] = useState<RootParamList[keyof RootParamList] | undefined>(
    undefined
  )
  const [callback, setCallback] = useState<(() => void) | undefined>(undefined)

  const registerNavigationIntent = useCallback(
    (params: Q['variables']) => {
      loadQuery(params, {
        networkCacheConfig: {
          poll: pollingInterval,
        },
      })
    },
    [loadQuery, pollingInterval]
  )

  const preloadedNavigate = useCallback(
    (args: any, cb?: () => void) => {
      setTargetArgs(args)
      setCallback(cb)
    },
    [setTargetArgs]
  )

  // HACK: `preloadedQuery` will be `null` for a few cycles after calling `loadQuery` which
  // means we cannot yet navigate to that screen as it won't get updates.
  // Other possible solutions: store preloadedQuery outside of this hook (redux?)
  useEffect(() => {
    if (!preloadedQuery || !screen || !targetArgs) return

    // @ts-ignore is ok if targetArgs.params is undefined
    const params = { ...(targetArgs.params ?? {}), preloadedQuery }
    rootNavigate(screen, { ...targetArgs, params: params })
    callback?.()
  }, [preloadedQuery, targetArgs, screen, callback])

  return { registerNavigationIntent, preloadedNavigate }
}
