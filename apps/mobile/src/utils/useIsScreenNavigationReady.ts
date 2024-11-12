import { useEffect, useState } from 'react'
import { AppStackNavigationProp } from 'src/app/navigation/types'
import { isIOS } from 'utilities/src/platform'

/**
 * Utility hook used to delay rendering initially so that the screen render a skeleton of placeholders
 * to allow navigation to progress before rendering heavier components that may appear as lag
 */
export function useIsScreenNavigationReady({ navigation }: { navigation: AppStackNavigationProp }): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isIOS) {
      // iOS doesn't need a longer delay to speed up perf, so we start rendering on the next tick.
      setTimeout(() => setReady(true), 0)
      return
    }

    // Android struggles to render the screen while it's animating, so we delay rendering until after the transition ends.
    navigation.addListener('transitionEnd', () => setReady(true))
  }, [navigation])

  return ready
}
