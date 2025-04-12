import { DdSdkReactNative } from '@datadog/mobile-react-native'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'

/**
 * Helper hook for the home screen to track any user specific attributes.
 */
export function useHomeScreenTracking(): void {
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)

  useEffect(() => {
    DdSdkReactNative.setAttributes({
      favoriteTokensCount: favoriteCurrencyIds.length,
    }).catch(() => undefined)
  }, [favoriteCurrencyIds.length])
}
