import { NavigationContainerRefContext, NavigationContext } from '@react-navigation/core'
import { useCallback, useContext, useEffect } from 'react'
import { InteractionManager } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { navigate as rootNavigate } from 'src/app/navigation/rootNavigation'
import { useAppStackNavigation, useExploreStackNavigation } from 'src/app/navigation/types'
import { baseCurrencyIds } from 'src/components/TokenSelector/hooks'
import {
  useExploreTokensTabLazyQuery,
  usePortfolioBalanceLazyQuery,
  usePortfolioBalancesLazyQuery,
  useTokenProjectsLazyQuery,
  useTopTokensLazyQuery,
  useTransactionListLazyQuery,
} from 'src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { getTokensOrderByValues } from 'src/features/explore/utils'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import { selectTokensOrderBy } from 'src/features/wallet/selectors'
import { Screens } from 'src/screens/Screens'

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerActivityNavigation(): {
  preload: (address: string) => void
  navigate: () => void
} {
  const navigation = useAppStackNavigation()
  const [load] = useTransactionListLazyQuery()

  const preload = useCallback(
    (address: string) => {
      load({
        variables: {
          address,
        },
      })
    },
    [load]
  )

  const navigate = useCallback(() => navigation.navigate(Screens.Activity), [navigation])

  return { preload, navigate }
}

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerExternalProfileNavigation(): {
  preload: (address: string) => void
  navigate: (address: string) => void
} {
  const navigation = useExploreStackNavigation()

  const [load] = useTransactionListLazyQuery()

  const preload = useCallback(
    (address: string) => {
      load({ variables: { address } })
    },
    [load]
  )

  const navigate = useCallback(
    (address: string) => navigation.navigate(Screens.ExternalProfile, { address }),
    [navigation]
  )

  return { preload, navigate }
}

export function useEagerExternalProfileRootNavigation(): {
  preload: (address: string) => void
  navigate: (address: string, callback: () => void) => void
} {
  const [load] = useTransactionListLazyQuery()

  const preload = useCallback(
    (address: string) => {
      load({
        variables: {
          address,
        },
      })
    },
    [load]
  )

  const navigate = useCallback((address: string, callback?: () => void) => {
    rootNavigate(Screens.ExternalProfile, { address }).then(() => {
      callback?.()
    })
  }, [])

  return { preload, navigate }
}

/** Preloaded home screen queries that reload on active account change */
export function usePreloadedHomeScreenQueries(): void {
  const [loadPortfolioBalance] = usePortfolioBalanceLazyQuery()
  const [loadPortfolioBalances] = usePortfolioBalancesLazyQuery()
  const [loadTransactionHistory] = useTransactionListLazyQuery()

  const activeAccountAddress = useActiveAccountAddress()

  useEffect(() => {
    if (!activeAccountAddress) {
      return
    }

    loadPortfolioBalance({ variables: { owner: activeAccountAddress } })
    loadPortfolioBalances({ variables: { ownerAddress: activeAccountAddress } })
    loadTransactionHistory({ variables: { address: activeAccountAddress } })
  }, [activeAccountAddress, loadPortfolioBalance, loadPortfolioBalances, loadTransactionHistory])
}

/** Set of queries that should be preloaded, but can wait for idle time. */
export function useLowPriorityPreloadedQueries(): void {
  // Explore screen
  const [loadExploreTokens] = useExploreTokensTabLazyQuery()
  const orderBy = useAppSelector(selectTokensOrderBy)

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      const { serverOrderBy } = getTokensOrderByValues(orderBy)
      loadExploreTokens({ variables: { topTokensOrderBy: serverOrderBy } })
    })
    // only want to preload on app mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadExploreTokens])

  // Token selector
  const [loadTopTokens] = useTopTokensLazyQuery()
  const [loadTokenProjects] = useTokenProjectsLazyQuery()

  useEffect(() => {
    const baseCurrencyContracts = baseCurrencyIds.map((id) => currencyIdToContractInput(id))

    InteractionManager.runAfterInteractions(() => {
      loadTokenProjects({ variables: { contracts: baseCurrencyContracts } })
      loadTopTokens()
    })
  }, [loadTopTokens, loadTokenProjects])
}

/**
 * Utility hook that checks if the caller is part of the navigation tree.
 *
 * Inspired by how the navigation library checks if the the navigation object exists.
 * https://github.com/react-navigation/react-navigation/blob/d7032ba8bb6ae24030a47f0724b61b561132fca6/packages/core/src/useNavigation.tsx#L18
 */
export function useIsPartOfNavigationTree(): boolean {
  const root = useContext(NavigationContainerRefContext)
  const navigation = useContext(NavigationContext)

  return navigation !== undefined || root !== undefined
}
