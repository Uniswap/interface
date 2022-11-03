import { NavigationContainerRefContext, NavigationContext } from '@react-navigation/core'
import { useCallback, useContext, useEffect } from 'react'
import { navigate as rootNavigate } from 'src/app/navigation/rootNavigation'
import { useAppStackNavigation, useExploreStackNavigation } from 'src/app/navigation/types'
import { baseCurrencyIds } from 'src/components/TokenSelector/hooks'
import {
  usePortfolioBalanceLazyQuery,
  usePortfolioBalancesLazyQuery,
  useTokenProjectsLazyQuery,
  useTopTokensLazyQuery,
  useTransactionListLazyQuery,
} from 'src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerActivityNavigation() {
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
export function useEagerExternalProfileNavigation() {
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

export function useEagerExternalProfileRootNavigation() {
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
export function usePreloadedHomeScreenQueries() {
  const [loadPortfolioBalance] = usePortfolioBalanceLazyQuery()
  const [loadPortfolioBalances] = usePortfolioBalancesLazyQuery()
  const [loadTopTokens] = useTopTokensLazyQuery()
  const [loadTokenProjects] = useTokenProjectsLazyQuery()

  const activeAccountAddress = useActiveAccountAddress()

  useEffect(() => {
    if (!activeAccountAddress) {
      return
    }

    loadPortfolioBalance({ variables: { owner: activeAccountAddress } })

    // queries for token selector
    loadPortfolioBalances({ variables: { ownerAddress: activeAccountAddress } })
  }, [activeAccountAddress, loadPortfolioBalance, loadPortfolioBalances])

  useEffect(() => {
    loadTopTokens()

    const baseCurrencyContracts = baseCurrencyIds.map((id) => currencyIdToContractInput(id))
    loadTokenProjects({ variables: { contracts: baseCurrencyContracts } })
  }, [loadTopTokens, loadTokenProjects])
}

/**
 * Utility hook that checks if the caller is part of the navigation tree.
 *
 * Inspired by how the navigation library checks if the the navigation object exists.
 * https://github.com/react-navigation/react-navigation/blob/d7032ba8bb6ae24030a47f0724b61b561132fca6/packages/core/src/useNavigation.tsx#L18
 */
export function useIsPartOfNavigationTree() {
  const root = useContext(NavigationContainerRefContext)
  const navigation = useContext(NavigationContext)

  return navigation !== undefined || root !== undefined
}
