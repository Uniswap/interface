import type { PropsWithChildren } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import ContextMenu from 'react-native-context-menu-view'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { TouchableArea } from 'ui/src'
import { borderRadii } from 'ui/src/theme'
import type { TokenBalanceItemContextMenuProps } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useTokenContextMenuOptions } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { useEvent } from 'utilities/src/react/hooks'

// TODO merge into a single implementation once context menu performance is improved
export function TokenBalanceItemContextMenu({
  children,
  portfolioBalance,
  excludedActions,
  openContractAddressExplainerModal,
  copyAddressToClipboard,
  onPressToken: onPressToken,
}: PropsWithChildren<TokenBalanceItemContextMenuProps>): JSX.Element {
  const menuActions = useTokenContextMenuOptions({
    excludedActions,
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: portfolioBalance.currencyInfo.currency.symbol,
    portfolioBalance,
    openContractAddressExplainerModal,
    copyAddressToClipboard,
    closeMenu: () => {},
  })

  const delayedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressActive = useRef(false)

  useEffect(() => {
    return () => {
      if (delayedTimeoutRef.current) {
        clearTimeout(delayedTimeoutRef.current)
      }
    }
  }, [])

  const handleOnPressToken = useEvent(() => {
    if (isLongPressActive.current) {
      return
    }

    onPressToken?.()
  })

  const actions = useMemo((): ContextMenuAction[] => {
    return menuActions.map((action) => ({
      title: action.label,
      systemIcon: actionToIcon[action.id],
    }))
  }, [menuActions])

  const onContextMenuPress = useCallback(
    (e: { nativeEvent: ContextMenuOnPressNativeEvent }): void => {
      menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions],
  )

  const style = useMemo(() => ({ borderRadius: borderRadii.rounded16 }), [])

  // Callback to set the long press flag
  const setLongPressActive = useEvent((active: boolean) => {
    isLongPressActive.current = active
  })

  // Callback to reset long press flag with delay
  const resetLongPressFlag = useEvent(() => {
    if (delayedTimeoutRef.current) {
      clearTimeout(delayedTimeoutRef.current)
    }

    delayedTimeoutRef.current = setTimeout(() => {
      isLongPressActive.current = false
    }, 200)
  })

  const longPressGesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(300)
        .onStart(() => {
          'worklet'
          runOnJS(setLongPressActive)(true)
        })
        .onEnd(() => {
          'worklet'
          runOnJS(resetLongPressFlag)()
        }),
    [resetLongPressFlag, setLongPressActive],
  )

  return (
    <GestureDetector gesture={longPressGesture}>
      <ContextMenu actions={actions} disabled={menuActions.length === 0} style={style} onPress={onContextMenuPress}>
        <TouchableArea onPress={handleOnPressToken}>{children}</TouchableArea>
      </ContextMenu>
    </GestureDetector>
  )
}

const actionToIcon: Record<string, string> = {
  swap: 'rectangle.2.swap',
  send: 'paperplane',
  receive: 'qrcode',
  share: 'square.and.arrow.up',
  toggleVisibility: 'eye',
  copyAddress: 'doc.on.doc',
}
