import type { PropsWithChildren } from 'react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import ContextMenu from 'react-native-context-menu-view'
import { TouchableArea } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import type { PositionItemContextMenuProps } from 'uniswap/src/components/portfolio/PositionItem/PositionItemContextMenu'
import { useReportPositionAction } from 'uniswap/src/features/positions/hooks/useReportPositionAction'
import { useTogglePositionVisibility } from 'uniswap/src/features/positions/hooks/useTogglePositionVisibility'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { noop } from 'utilities/src/react/noop'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

type NativeMenuAction = {
  label: string
  systemIcon: string
  destructive: boolean
  onPress: () => void
}

export function PositionItemContextMenu({
  children,
  positionInfo,
  isVisible,
  onReportSuccess,
  onRowPress,
}: PropsWithChildren<PositionItemContextMenuProps>): JSX.Element {
  const { t } = useTranslation()
  const trace = useTrace()
  const reportPosition = useReportPositionAction({ onSuccess: onReportSuccess, showReportedNotification: true })
  const togglePositionVisibility = useTogglePositionVisibility()

  const menuActions = useMemo<NativeMenuAction[]>(() => {
    const actionList: NativeMenuAction[] = [
      {
        label: isVisible ? t('position.hide') : t('position.unhide'),
        systemIcon: isVisible ? 'eye.slash' : 'eye',
        destructive: false,
        onPress: () => togglePositionVisibility({ position: positionInfo, isVisible }),
      },
    ]
    if (!positionInfo.isHidden) {
      actionList.push({
        label: t('nft.reportSpam'),
        systemIcon: 'flag',
        destructive: true,
        onPress: () => reportPosition({ position: positionInfo, isVisible }),
      })
    }
    return actionList
  }, [isVisible, positionInfo, reportPosition, togglePositionVisibility, t])

  const actions = useMemo<ContextMenuAction[]>(
    () =>
      menuActions.map((action) => ({
        title: action.label,
        destructive: action.destructive,
        systemIcon: action.systemIcon,
      })),
    [menuActions],
  )

  const onContextMenuPress = useCallback(
    (e: { nativeEvent: ContextMenuOnPressNativeEvent }): void => {
      const index = e.nativeEvent.index
      const action = menuActions[index]
      if (!action) {
        return
      }
      sendAnalyticsEvent(UniswapEventName.ContextMenuItemClicked, {
        element: ElementName.LiquidityPositionContextMenu,
        section: SectionName.PortfolioPoolsTab,
        menu_item: action.label,
        menu_item_index: index,
        ...trace,
      })
      action.onPress()
    },
    [menuActions, trace],
  )

  const style = useMemo(() => ({ borderRadius: borderRadii.rounded16 }), [])

  return (
    <ContextMenu actions={actions} disabled={menuActions.length === 0} style={style} onPress={onContextMenuPress}>
      <TouchableArea onLongPress={noop} onPress={onRowPress ?? noop}>
        {children}
      </TouchableArea>
    </ContextMenu>
  )
}
