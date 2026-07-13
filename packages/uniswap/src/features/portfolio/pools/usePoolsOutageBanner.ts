import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { selectHasDismissedPoolsOutageBanner } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasDismissedPoolsOutageBanner } from 'uniswap/src/features/behaviorHistory/slice'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPoolsUnavailableMessage } from 'uniswap/src/features/portfolio/pools/getPoolsFailedNetworks'
import { usePoolsFailedNetworks } from 'uniswap/src/features/portfolio/pools/usePoolsFailedNetworks'
import { useEvent } from 'utilities/src/react/hooks'

interface UsePoolsOutageBannerParams {
  evmAddress?: string
  svmAddress?: string
  chainId?: UniverseChainId
  enabled: boolean
}

interface PoolsOutageBanner {
  isVisible: boolean
  message: string
  /** Present only for a partial outage (dismissible). A full outage shows a non-dismissible banner. */
  onDismiss?: () => void
}

export function usePoolsOutageBanner({
  evmAddress,
  svmAddress,
  chainId,
  enabled,
}: UsePoolsOutageBannerParams): PoolsOutageBanner {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const hasDismissed = useSelector(selectHasDismissedPoolsOutageBanner)
  const { failedChainIds, hasResolved, isPoolsUnavailable } = usePoolsFailedNetworks({
    evmAddress,
    svmAddress,
    chainId,
    enabled,
  })
  const hasFailedChains = failedChainIds.length > 0

  useEffect(() => {
    if (hasResolved && !hasFailedChains && !isPoolsUnavailable && hasDismissed) {
      dispatch(setHasDismissedPoolsOutageBanner(false))
    }
  }, [hasResolved, hasFailedChains, isPoolsUnavailable, hasDismissed, dispatch])

  const onDismiss = useEvent(() => {
    dispatch(setHasDismissedPoolsOutageBanner(true))
  })

  if (isPoolsUnavailable) {
    return { isVisible: true, message: t('pool.balances.unavailable') }
  }
  if (hasFailedChains && !hasDismissed) {
    return { isVisible: true, message: getPoolsUnavailableMessage({ chainIds: failedChainIds, t }), onDismiss }
  }
  return { isVisible: false, message: '' }
}
