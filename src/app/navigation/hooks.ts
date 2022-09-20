import { useEagerNavigation } from 'src/app/navigation/useEagerNavigation'
import { preloadMapping } from 'src/data/preloading'
import { activityScreenQuery } from 'src/screens/ActivityScreen'
import { Screens } from 'src/screens/Screens'
import { userScreenQuery } from 'src/screens/UserScreen'
import { ActivityScreenQuery } from 'src/screens/__generated__/ActivityScreenQuery.graphql'
import { UserScreenQuery } from 'src/screens/__generated__/UserScreenQuery.graphql'

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query neede to render transaction list.
 */
export function useEagerActivityNavigation() {
  const { registerNavigationIntent, preloadedNavigate } =
    useEagerNavigation<ActivityScreenQuery>(activityScreenQuery)

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
  const { registerNavigationIntent, preloadedNavigate } =
    useEagerNavigation<UserScreenQuery>(userScreenQuery)

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
