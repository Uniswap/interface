import { NavigationContainerRefContext, NavigationContext } from '@react-navigation/core'
import { useCallback, useContext, useEffect } from 'react'
import { useEagerNavigation, useEagerRootNavigation } from 'src/app/navigation/useEagerNavigation'
import { baseCurrencyIds } from 'src/components/TokenSelector/hooks'
import { transactionListQuery } from 'src/components/TransactionList/TransactionList'
import { TransactionListQuery } from 'src/components/TransactionList/__generated__/TransactionListQuery.graphql'
import { PollingInterval } from 'src/constants/misc'
import { preloadMapping } from 'src/data/preloading'
import {
  usePortfolioBalanceLazyQuery,
  usePortfolioBalancesLazyQuery,
  useTokenProjectsLazyQuery,
  useTopTokensLazyQuery,
} from 'src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import { Screens, Tabs } from 'src/screens/Screens'

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerActivityNavigation() {
  const { registerNavigationIntent, preloadedNavigate } = useEagerNavigation<TransactionListQuery>(
    transactionListQuery,
    PollingInterval.Normal
  )

  const preload = (address: string) => {
    registerNavigationIntent(
      preloadMapping.activity({
        address,
      })
    )
  }

  const navigate = (address: string) => {
    preloadedNavigate(Screens.Activity, { address })
  }

  return { preload, navigate }
}

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query neede to render transaction list.
 */
export function useEagerExternalProfileNavigation() {
  const { registerNavigationIntent, preloadedNavigate } = useEagerNavigation<TransactionListQuery>(
    transactionListQuery,
    PollingInterval.Normal
  )

  const preload = (address: string) => {
    registerNavigationIntent(
      preloadMapping.activity({
        address,
      })
    )
  }

  const navigate = (address: string) => {
    preloadedNavigate(Screens.ExternalProfile, { address })
  }

  return { preload, navigate }
}

export function useEagerExternalProfileRootNavigation() {
  const { registerNavigationIntent, preloadedNavigate } =
    useEagerRootNavigation<TransactionListQuery>(Tabs.Explore, transactionListQuery)

  const preload = useCallback(
    (address: string) => {
      registerNavigationIntent(
        preloadMapping.externalProfile({
          address,
        })
      )
    },
    [registerNavigationIntent]
  )

  const navigate = useCallback(
    (address: string, callback?: () => void) => {
      preloadedNavigate({ screen: Screens.ExternalProfile, params: { address } }, callback)
    },
    [preloadedNavigate]
  )

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
