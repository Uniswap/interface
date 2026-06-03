import { isExtensionApp } from '@universe/environment'
import { memo, PropsWithChildren, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { Flag } from 'ui/src/components/icons/Flag'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Pools } from 'ui/src/components/icons/Pools'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { PositionItemContextMenuProps } from 'uniswap/src/components/portfolio/PositionItem/PositionItemContextMenu'
import { useReportPositionAction } from 'uniswap/src/features/positions/hooks/useReportPositionAction'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { setPositionVisibility } from 'uniswap/src/features/visibility/slice'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const PositionItemContextMenu = memo(function PositionItemContextMenu({
  children,
  positionInfo,
  isVisible,
  onReportSuccess,
  onRowPress,
  onManagePress,
  onPoolInfoPress,
}: PropsWithChildren<PositionItemContextMenuProps>): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu, toggle } = useBooleanState(false)
  const reportPosition = useReportPositionAction({ onSuccess: onReportSuccess })

  const menuActions = useMemo((): MenuOptionItem[] => {
    const externalLinkTrailing = <ExternalLink color="$neutral3" size="$icon.16" />
    const items: MenuOptionItem[] = []

    if (onManagePress) {
      items.push({
        onPress: () => {
          closeMenu()
          onManagePress()
        },
        label: t('common.manage'),
        Icon: Pools,
        trailingIcon: externalLinkTrailing,
      })
    }

    if (onPoolInfoPress) {
      items.push({
        onPress: () => {
          closeMenu()
          onPoolInfoPress()
        },
        label: t('pool.info'),
        Icon: InfoCircleFilled,
        trailingIcon: externalLinkTrailing,
      })
    }

    items.push({
      onPress: () => {
        closeMenu()
        dispatch(
          setPositionVisibility({
            poolId: positionInfo.poolId,
            tokenId: positionInfo.tokenId,
            chainId: positionInfo.chainId,
            isVisible: !isVisible,
          }),
        )
      },
      label: isVisible ? t('position.hide') : t('position.unhide'),
      Icon: isVisible ? EyeOff : Eye,
    })

    if (!positionInfo.isHidden) {
      items.push({
        onPress: () => {
          closeMenu()
          reportPosition({ position: positionInfo, isVisible })
        },
        label: t('nft.reportSpam'),
        Icon: Flag,
        destructive: true,
      })
    }

    return items
  }, [closeMenu, dispatch, isVisible, onManagePress, onPoolInfoPress, positionInfo, reportPosition, t])

  const suppressNativeContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const stopPress = useCallback((e: { stopPropagation: () => void }) => e.stopPropagation(), [])

  return (
    <ContextMenu
      trackItemClicks
      menuItems={menuActions}
      triggerMode={isExtensionApp ? ContextMenuTriggerMode.Primary : ContextMenuTriggerMode.Secondary}
      isOpen={isOpen}
      openMenu={openMenu}
      closeMenu={closeMenu}
      elementName={ElementName.PortfolioPoolContextMenu}
      sectionName={SectionName.PortfolioPoolsTab}
    >
      {/* oxlint-disable-next-line react/forbid-elements -- needed for cursor + onContextMenu */}
      <div style={{ cursor: 'pointer' }} onContextMenu={isExtensionApp ? suppressNativeContextMenu : toggle}>
        <TouchableArea onPressIn={stopPress} onPressOut={stopPress} onPress={isExtensionApp ? toggle : onRowPress}>
          {children}
        </TouchableArea>
      </div>
    </ContextMenu>
  )
})
