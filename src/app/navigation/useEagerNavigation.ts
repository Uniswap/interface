import { useNavigation } from '@react-navigation/core'
import { useEffect, useState } from 'react'
import { GraphQLTaggedNode, useQueryLoader } from 'react-relay'
import { OperationType } from 'relay-runtime'
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
export function useEagerNavigation<Q extends OperationType>(query: GraphQLTaggedNode) {
  const { navigate } = useNavigation<any>()

  const [preloadedQuery, loadQuery] = useQueryLoader<Q>(query)

  // Stores params for the next navigation action
  const [targetScreen, setTargetScreen] = useState<Screens | null>(null)
  const [targetParams, setTargetParams] = useState<Object>({})

  function registerNavigationIntent(params: Q['variables']) {
    loadQuery(params)
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
