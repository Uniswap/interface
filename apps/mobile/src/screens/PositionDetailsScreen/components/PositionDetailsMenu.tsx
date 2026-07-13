import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Flex } from 'ui/src'
import { Ellipsis, Eye, EyeOff, Flag } from 'ui/src/components/icons'
import { ContextMenu, type MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useReportPositionAction } from 'uniswap/src/features/positions/hooks/useReportPositionAction'
import { useTogglePositionVisibility } from 'uniswap/src/features/positions/hooks/useTogglePositionVisibility'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function PositionDetailsMenu({ positionInfo }: { positionInfo: PositionInfo }): JSX.Element {
  const { t } = useTranslation()
  const navigation = useAppStackNavigation()
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)

  const isPositionVisible = usePositionVisibilityCheck()
  const togglePositionVisibility = useTogglePositionVisibility()
  const reportPosition = useReportPositionAction({ showReportedNotification: true })

  const isVisible = isPositionVisible({
    poolId: positionInfo.poolId,
    tokenId: positionInfo.tokenId,
    chainId: positionInfo.chainId,
    isFlaggedSpam: positionInfo.isHidden,
  })

  const menuItems = useMemo<MenuOptionItem[]>(
    () => [
      {
        label: isVisible ? t('position.hide') : t('position.unhide'),
        Icon: isVisible ? EyeOff : Eye,
        onPress: () => {
          closeMenu()
          togglePositionVisibility({ position: positionInfo, isVisible })
          navigation.goBack()
        },
      },
      {
        label: t('nft.reportSpam'),
        Icon: Flag,
        destructive: true,
        onPress: () => {
          closeMenu()
          reportPosition({ position: positionInfo, isVisible })
          navigation.goBack()
        },
      },
    ],
    [closeMenu, navigation, positionInfo, reportPosition, togglePositionVisibility, t, isVisible],
  )

  return (
    <ContextMenu
      trackItemClicks
      closeMenu={closeMenu}
      elementName={ElementName.LiquidityPositionContextMenu}
      isOpen={isOpen}
      menuItems={menuItems}
      openMenu={openMenu}
      sectionName={SectionName.PortfolioPoolsTab}
      triggerMode={ContextMenuTriggerMode.Primary}
    >
      <Flex p="$spacing8">
        <Ellipsis color="$neutral2" size="$icon.24" />
      </Flex>
    </ContextMenu>
  )
}
