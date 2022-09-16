import { useEagerNavigation } from 'src/app/navigation/useEagerNavigation'
import { preloadMapping } from 'src/data/preloading'
import { activityScreenQuery } from 'src/screens/ActivityScreen'
import { Screens } from 'src/screens/Screens'
import { ActivityScreenQuery } from 'src/screens/__generated__/ActivityScreenQuery.graphql'

/** Utility hook to simplify navigating to profile screen
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
