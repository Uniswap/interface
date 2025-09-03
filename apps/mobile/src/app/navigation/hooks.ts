import { NavigationContainerRefContext, NavigationContext, useFocusEffect } from '@react-navigation/core'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useContext } from 'react'
import { BackHandler } from 'react-native'
import { navigate as rootNavigate } from 'src/app/navigation/rootNavigation'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { useTransactionListLazyQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { GqlChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'

interface EagerExternalProfileNavigationResult {
  preload: (address: string) => Promise<void>
  navigate: (address: string) => void
}

interface EagerExternalProfileRootNavigationResult {
  preload: (address: string) => Promise<void>
  navigate: (address: string, callback?: () => void) => Promise<void>
}

/**
 * Factory hook that returns external profile navigation utilities based on the active data source
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerExternalProfileNavigation(): EagerExternalProfileNavigationResult {
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestTransactions)

  const graphqlResult = useGraphQLEagerExternalProfileNavigation()
  const restResult = useRESTEagerExternalProfileNavigation()

  return isRestEnabled ? restResult : graphqlResult
}

/**
 * Factory hook that returns external profile root navigation utilities based on the active data source
 */
export function useEagerExternalProfileRootNavigation(): EagerExternalProfileRootNavigationResult {
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestTransactions)

  const graphqlResult = useGraphQLEagerExternalProfileRootNavigation()
  const restResult = useRESTEagerExternalProfileRootNavigation()

  return isRestEnabled ? restResult : graphqlResult
}

function useGraphQLEagerExternalProfileNavigation(): EagerExternalProfileNavigationResult {
  const navigation = useExploreStackNavigation()
  const [load] = useTransactionListLazyQuery()
  const { gqlChains } = useEnabledChains()

  const preload = useCallback(
    async (address: string) => {
      await load({ variables: { address, chains: gqlChains.filter(chain => chain !== 'CITREA_TESTNET') as GqlChainId[] } })
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

function useRESTEagerExternalProfileNavigation(): EagerExternalProfileNavigationResult {
  const navigation = useExploreStackNavigation()
  const queryClient = useQueryClient()
  const { chains: chainIds } = useEnabledChains()

  const preload = useCallback(
    async (address: string) => {
      await queryClient.prefetchQuery(getListTransactionsQuery({ input: { evmAddress: address, chainIds } }))
    },
    [chainIds, queryClient],
  )

  const navigate = useCallback(
    (address: string) => {
      navigation.navigate(MobileScreens.ExternalProfile, { address })
    },
    [navigation],
  )

  return { preload, navigate }
}

function useGraphQLEagerExternalProfileRootNavigation(): EagerExternalProfileRootNavigationResult {
  const [load] = useTransactionListLazyQuery()
  const { gqlChains } = useEnabledChains()

  const preload = useCallback(
    async (address: string) => {
      await load({
        variables: {
          address,
          chains: gqlChains.filter(chain => chain !== 'CITREA_TESTNET') as GqlChainId[],
        },
      })
    },
    [gqlChains, load],
  )

  const navigate = useEvent(async (address: string, callback?: () => void) => {
    await rootNavigate(MobileScreens.ExternalProfile, { address })
    callback?.()
  })

  return { preload, navigate }
}

function useRESTEagerExternalProfileRootNavigation(): EagerExternalProfileRootNavigationResult {
  const queryClient = useQueryClient()
  const { chains: chainIds } = useEnabledChains()

  const preload = useCallback(
    async (address: string) => {
      await queryClient.prefetchQuery(getListTransactionsQuery({ input: { evmAddress: address, chainIds } }))
    },
    [chainIds, queryClient],
  )

  const navigate = useEvent(async (address: string, callback?: () => void) => {
    await rootNavigate(MobileScreens.ExternalProfile, { address })
    callback?.()
  })

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
