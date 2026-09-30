import { Flex } from '@universe/mycelium'
import { Ellipsis } from '@universe/mycelium/icons/Ellipsis'
import { Flag } from '@universe/mycelium/icons/Flag'
import { TestID } from '@universe/test'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MODAL_OPEN_WAIT_TIME } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/rootNavigation'
import { ContextMenu, type MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function PortfolioChartDetailsMenu(): JSX.Element {
  const { t } = useTranslation()
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)

  const openReportModal = useCallback(() => {
    setTimeout(() => {
      navigate(ModalName.ReportPortfolioData, {})
    }, MODAL_OPEN_WAIT_TIME)
  }, [])

  const menuItems = useMemo<MenuOptionItem[]>(
    () => [
      {
        label: t('reporting.portfolio.report.link'),
        onPress: openReportModal,
        Icon: Flag,
      },
    ],
    [openReportModal, t],
  )

  return (
    <ContextMenu
      closeMenu={closeMenu}
      isOpen={isOpen}
      menuItems={menuItems}
      openMenu={openMenu}
      triggerMode={ContextMenuTriggerMode.Primary}
    >
      <Flex p="$spacing8" testID={TestID.PortfolioChartDetailsMoreButton}>
        <Ellipsis color="$neutral2" size="$icon.24" />
      </Flex>
    </ContextMenu>
  )
}
