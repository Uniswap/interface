import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'

/**
 * Helper hook for the home screen to track any user specific attributes.
 */
export function useHomeScreenTracking(): void {
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)

  useEffect(() => {
    setAttributesToDatadog({
      favoriteTokensCount: favoriteCurrencyIds.length,
    }).catch(() => undefined)
  }, [favoriteCurrencyIds.length])
}
