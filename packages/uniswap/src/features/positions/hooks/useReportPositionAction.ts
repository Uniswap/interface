import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { usePoolPositionCacheUpdater } from 'uniswap/src/features/dataApi/balances/poolPositionCacheUpdater'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { submitPoolSpamReport } from 'uniswap/src/features/reporting/reports'
import { setPositionVisibility } from 'uniswap/src/features/visibility/slice'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Cross-platform core for reporting a liquidity position as spam.
 * Sends the analytics event and hides the position client-side. When
 * `showReportedNotification` is set, surfaces a "Reported" toast via the shared
 * notification slice (extension + mobile); web opts out and shows its own popup.
 */
export function useReportPositionAction(options?: {
  /** Fired after the analytics event and (when applicable) the visibility dispatch. */
  onSuccess?: (input: { position: PositionInfo; isVisible: boolean }) => void
  /** Push a "Reported" toast on the shared notification slice (extension + mobile). */
  showReportedNotification?: boolean
}): (input: { position: PositionInfo; isVisible: boolean }) => void {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAddresses = useActiveAddresses()
  const updatePoolBalancesCache = usePoolPositionCacheUpdater(activeAddresses.evmAddress, activeAddresses.svmAddress)

  return useEvent((input: { position: PositionInfo; isVisible: boolean }) => {
    const { position, isVisible } = input

    submitPoolSpamReport({
      chainId: position.chainId,
      poolId: position.poolId,
      version: position.version,
      token0: position.currency0Amount.currency,
      token1: position.currency1Amount.currency,
    })

    if (isVisible) {
      // Match the hide-toggle path: optimistically subtract from the Pools header before dispatching.
      updatePoolBalancesCache(true, position)
      dispatch(
        setPositionVisibility({
          poolId: position.poolId,
          tokenId: position.tokenId,
          chainId: position.chainId,
          isVisible: false,
        }),
      )
    }

    if (options?.showReportedNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: t('common.reported'),
        }),
      )
    }

    options?.onSuccess?.(input)
  })
}
