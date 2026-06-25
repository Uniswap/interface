import { memo } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { PositionItem } from 'uniswap/src/components/portfolio/PositionItem/PositionItem'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Wraps PositionItem with a stable navigation handler so the memoized row isn't
 * re-created on every render of the pools list. Enables the long-press context menu
 * (Hide/Unhide + Report as spam) via `contextMenuActions`.
 */
export const PoolPositionRow = memo(function PoolPositionRow({
  positionInfo,
  isVisible,
  onReportSuccess,
}: {
  positionInfo: PositionInfo
  isVisible: boolean
  onReportSuccess?: () => void
}): JSX.Element {
  const navigation = useAppStackNavigation()

  const onPress = useEvent(() => {
    navigation.navigate(MobileScreens.PositionDetails, {
      poolId: positionInfo.poolId,
      tokenId: positionInfo.tokenId,
      chainId: positionInfo.chainId,
      protocolVersion: positionInfo.version,
    })
  })

  return (
    <PositionItem
      hasOuterPadding
      positionInfo={positionInfo}
      contextMenuActions={{ isVisible, onReportSuccess }}
      onPress={onPress}
    />
  )
})
