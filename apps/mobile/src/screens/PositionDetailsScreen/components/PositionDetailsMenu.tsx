import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Flex } from 'ui/src'
import { Ellipsis, EyeOff, Flag } from 'ui/src/components/icons'
import { ContextMenu, type MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useReportPositionAction } from 'uniswap/src/features/positions/hooks/useReportPositionAction'
import { useTogglePositionVisibility } from 'uniswap/src/features/positions/hooks/useTogglePositionVisibility'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function PositionDetailsMenu({ positionInfo }: { positionInfo: PositionInfo }): JSX.Element {
  const { t } = useTranslation()
  const navigation = useAppStackNavigation()
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)

  // The PDP is only reachable from visible positions, so isVisible is always true here.
  const togglePositionVisibility = useTogglePositionVisibility()
  const reportPosition = useReportPositionAction({ showReportedNotification: true })

  const menuItems = useMemo<MenuOptionItem[]>(
    () => [
      {
        label: t('position.hide'),
        Icon: EyeOff,
        onPress: () => {
          closeMenu()
          togglePositionVisibility({ position: positionInfo, isVisible: true })
          navigation.goBack()
        },
      },
      {
        label: t('nft.reportSpam'),
        Icon: Flag,
        destructive: true,
        onPress: () => {
          closeMenu()
          reportPosition({ position: positionInfo, isVisible: true })
          navigation.goBack()
        },
      },
    ],
    [closeMenu, navigation, positionInfo, reportPosition, togglePositionVisibility, t],
  )

  return (
    <ContextMenu
      closeMenu={closeMenu}
      elementName={ElementName.PortfolioPoolContextMenu}
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
