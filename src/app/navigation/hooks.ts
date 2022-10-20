import { useCallback, useEffect } from 'react'
import { PreloadedQuery, useQueryLoader } from 'react-relay'
import { useEagerNavigation, useEagerRootNavigation } from 'src/app/navigation/useEagerNavigation'
import { PollingInterval } from 'src/constants/misc'
import { preloadMapping } from 'src/data/preloading'
import { portfolioBalanceQuery } from 'src/features/balances/PortfolioBalance'
import { PortfolioBalanceQuery } from 'src/features/balances/__generated__/PortfolioBalanceQuery.graphql'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import { activityScreenQuery } from 'src/screens/ActivityScreen'
import { externalProfileScreenQuery } from 'src/screens/ExternalProfileScreen'
import { Screens, Tabs } from 'src/screens/Screens'
import { ActivityScreenQuery } from 'src/screens/__generated__/ActivityScreenQuery.graphql'
import { ExternalProfileScreenQuery } from 'src/screens/__generated__/ExternalProfileScreenQuery.graphql'

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerActivityNavigation() {
  const { registerNavigationIntent, preloadedNavigate } = useEagerNavigation<ActivityScreenQuery>(
    activityScreenQuery,
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
  const { registerNavigationIntent, preloadedNavigate } =
    useEagerNavigation<ExternalProfileScreenQuery>(
      externalProfileScreenQuery,
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
    useEagerRootNavigation<ExternalProfileScreenQuery>(Tabs.Explore, externalProfileScreenQuery)

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

// list of queries used on the home screen that are preloaded
// only portfolio balance now, but token balances, etc. in the future
export type HomeScreenQueries = {
  portfolioBalanceQueryRef: NullUndefined<PreloadedQuery<PortfolioBalanceQuery>>
}

/** Preloaded home screen query refs that reload on active account change */
export function usePreloadedHomeScreenQueries(): HomeScreenQueries {
  const activeAccountAddress = useActiveAccountAddress()
  const [portfolioBalanceQueryRef, loadPortfolioBalance] =
    useQueryLoader<PortfolioBalanceQuery>(portfolioBalanceQuery)

  useEffect(() => {
    if (!activeAccountAddress) {
      return
    }

    // reload home query when active account changes
    loadPortfolioBalance(
      { owner: activeAccountAddress },
      { networkCacheConfig: { poll: PollingInterval.Fast } }
    )
  }, [activeAccountAddress, loadPortfolioBalance])

  return { portfolioBalanceQueryRef }
}
