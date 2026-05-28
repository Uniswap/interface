import { NavigationContainerRefContext, NavigationContext, useFocusEffect } from '@react-navigation/core'
import { useCallback, useContext } from 'react'
import { BackHandler } from 'react-native'
import { navigate as rootNavigate } from 'src/app/navigation/rootNavigation'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { useTransactionListLazyQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerExternalProfileNavigation(): {
  preload: (address: string) => Promise<void>
  navigate: (address: string) => void
} {
  const navigation = useExploreStackNavigation()

  const [load] = useTransactionListLazyQuery()
  const { gqlChains } = useEnabledChains()

  const preload = useCallback(
    async (address: string) => {
      await load({ variables: { address, chains: gqlChains } })
    },
    [gqlChains, load],
  )

  const navigate = useCallback(
    (address: string) => {
      navigation.navigate(MobileScreens.ExternalProfile, { address })
    },
    [navigation],
  )

  return { preload, navigate }
}

export function useEagerExternalProfileRootNavigation(): {
  preload: (address: string) => Promise<void>
  navigate: (address: string, callback: () => void) => Promise<void>
} {
  const [load] = useTransactionListLazyQuery()
  const { gqlChains } = useEnabledChains()

  const preload = useCallback(
    async (address: string) => {
      await load({
        variables: {
          address,
          chains: gqlChains,
        },
      })
    },
    [gqlChains, load],
  )

  const navigate = useCallback(async (address: string, callback?: () => void) => {
    await rootNavigate(MobileScreens.ExternalProfile, { address })
    callback?.()
  }, [])

  return { preload, navigate }
}

/**
 * Utility hook that checks if the caller is part of the navigation tree.
 *
 * Inspired by how the navigation library checks if the navigation object exists.
 * https://github.com/react-navigation/react-navigation/blob/d7032ba8bb6ae24030a47f0724b61b561132fca6/packages/core/src/useNavigation.tsx#L18
 */
export function useIsPartOfNavigationTree(): boolean {
  const root = useContext(NavigationContainerRefContext)
  const navigation = useContext(NavigationContext)

  return navigation !== undefined || root !== undefined
}

/**
 * Overrides android default back button behaviour to allow
 * navigating back to Tokens Tab when other tab is picked
 */
export function useHomeScreenCustomAndroidBackButton(
  routeTabIndex: HomeScreenTabIndex,
  setRouteTabIndex: (value: React.SetStateAction<HomeScreenTabIndex>) => void,
): void {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => {
        if (routeTabIndex !== HomeScreenTabIndex.Tokens) {
          setRouteTabIndex(HomeScreenTabIndex.Tokens)
          return true
        }
        return false
      }
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return subscription.remove
    }, [routeTabIndex, setRouteTabIndex]),
  )
}
