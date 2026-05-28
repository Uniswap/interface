import { exploreNavigationRef } from 'src/app/navigation/navigationRef'
import { navigate } from 'src/app/navigation/rootNavigation'
import { ExploreModalState } from 'src/app/navigation/types'
import { dismissAllModalsBeforeNavigation } from 'src/features/deepLinking/utils'
import { call } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { ExploreOrderBy, isSupportedExploreOrderBy } from 'wallet/src/features/wallet/types'

const getValidRankingType = (metric: string | null): ExploreOrderBy | undefined => {
  if (!metric) {
    return undefined
  }
  const upperMetric = metric.toUpperCase()
  return isSupportedExploreOrderBy(upperMetric) ? upperMetric : undefined
}

export function* handleTopTokensDeepLink({ chainId, url }: { chainId?: UniverseChainId; url: string }): Generator {
  try {
    const urlObj = new URL(url)
    const metric = urlObj.searchParams.get('metric')

    // Validate the metric if provided
    const validMetric = getValidRankingType(metric)

    // Navigate to the Explore modal with deep link parameters
    const navParams: ExploreModalState = {
      screen: MobileScreens.Explore,
      params: {
        showFavorites: false,
        orderByMetric: validMetric,
        chainId,
      },
    }

    const ref = exploreNavigationRef.current
    if (ref && ref.isFocused()) {
      ref.navigate(MobileScreens.Explore, navParams.params)
    } else {
      // Dismiss any open modals before navigating
      yield* call(dismissAllModalsBeforeNavigation)
      yield* call(navigate, ModalName.Explore, navParams)
    }
  } catch (error) {
    yield* call(logger.error, error, {
      tags: { file: 'handleDeepLinkSaga', function: 'handleTopTokensDeepLink' },
      extra: { chainId, url },
    })
  }
}
