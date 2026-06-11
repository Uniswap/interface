import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { usePoolPositionCacheUpdater } from 'uniswap/src/features/dataApi/balances/poolPositionCacheUpdater'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { setPositionVisibility } from 'uniswap/src/features/visibility/slice'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Cross-platform core for toggling a liquidity position's visibility.
 * Optimistically updates the Pools header cache, flips the Redux visibility flag,
 * and surfaces a "Position hidden / unhidden" toast — mirroring the Tokens tab.
 */
export function useTogglePositionVisibility(): (input: { position: PositionInfo; isVisible: boolean }) => void {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { evmAddress, svmAddress } = useActiveAddresses()
  const updatePoolBalancesCache = usePoolPositionCacheUpdater(evmAddress, svmAddress)

  return useEvent((input: { position: PositionInfo; isVisible: boolean }) => {
    const { position, isVisible } = input

    // Optimistically move the Pools header USD/count before the next poll reconciles.
    // `isVisible` is the current state, i.e. whether we're about to hide.
    updatePoolBalancesCache(isVisible, position)
    dispatch(
      setPositionVisibility({
        poolId: position.poolId,
        tokenId: position.tokenId,
        chainId: position.chainId,
        isVisible: !isVisible,
      }),
    )
    dispatch(
      pushNotification({
        type: AppNotificationType.AssetVisibility,
        visible: isVisible,
        hideDelay: 2 * ONE_SECOND_MS,
        assetName: t('pool.position'),
      }),
    )
  })
}
