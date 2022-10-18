import { useCallback, useEffect } from 'react'
import { useQueryLoader } from 'react-relay'
import { useEagerNavigation, useEagerRootNavigation } from 'src/app/navigation/useEagerNavigation'
import { PollingInterval } from 'src/constants/misc'
import { preloadMapping } from 'src/data/preloading'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import { activityScreenQuery } from 'src/screens/ActivityScreen'
import { homeScreenQuery } from 'src/screens/HomeScreen'
import { Screens, Tabs } from 'src/screens/Screens'
import { userScreenQuery } from 'src/screens/UserScreen'
import { ActivityScreenQuery } from 'src/screens/__generated__/ActivityScreenQuery.graphql'
import { HomeScreenQuery } from 'src/screens/__generated__/HomeScreenQuery.graphql'
import { UserScreenQuery } from 'src/screens/__generated__/UserScreenQuery.graphql'

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
export function useEagerUserProfileNavigation() {
  const { registerNavigationIntent, preloadedNavigate } = useEagerNavigation<UserScreenQuery>(
    userScreenQuery,
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
    preloadedNavigate(Screens.User, { address })
  }

  return { preload, navigate }
}

export function useEagerUserProfileRootNavigation() {
  const { registerNavigationIntent, preloadedNavigate } = useEagerRootNavigation<UserScreenQuery>(
    Tabs.Explore,
    userScreenQuery
  )

  const preload = useCallback(
    (address: string) => {
      registerNavigationIntent(
        preloadMapping.user({
          address,
        })
      )
    },
    [registerNavigationIntent]
  )

  const navigate = useCallback(
    (address: string, callback?: () => void) => {
      preloadedNavigate({ screen: Screens.User, params: { address } }, callback)
    },
    [preloadedNavigate]
  )

  return { preload, navigate }
}

/** Preloaded home screen query ref that re-loads on active account change. */
export function usePreloadedHomeScreenQuery() {
  const activeAccountAddress = useActiveAccountAddress()
  const [homeScreenQueryRef, loadHomeScreenQuery] = useQueryLoader<HomeScreenQuery>(homeScreenQuery)

  useEffect(() => {
    if (!activeAccountAddress) {
      return
    }

    // reload home query when active account changes
    loadHomeScreenQuery(
      { owner: activeAccountAddress },
      { networkCacheConfig: { poll: PollingInterval.Fast } }
    )
  }, [activeAccountAddress, loadHomeScreenQuery])

  return homeScreenQueryRef
}
