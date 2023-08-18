import { useCallback, useEffect } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_BAR_HEIGHT } from 'src/components/layout/TabHelpers'
import { IS_IOS } from 'src/constants/globals'
import { dimensions } from 'ui/src/theme/restyle/sizing'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

export function useAdaptiveFooter(contentContainerStyle?: StyleProp<ViewStyle>): {
  onContentSizeChange?: (w: number, h: number) => void
  footerHeight: SharedValue<number>
  adaptiveFooter: JSX.Element
} {
  const insets = useSafeAreaInsets()
  // Use fullHeight as the initial value to properly position the TabBar
  // while changing tabs when data is loading (before the onContentSizeChange
  // was called and appropriate footer height was calculated)
  const footerHeight = useSharedValue(dimensions.fullHeight)
  const activeAccount = useActiveAccount()

  const onContentSizeChange = useCallback(
    (_: number, contentHeight: number) => {
      if (!contentContainerStyle) return
      // The height of the footer added to the list can be calculated from
      // the following equation (for collapsed tab bar):
      // fullHeight = TAB_BAR_HEIGHT + <real content height> + footerHeight + paddingBottom
      //
      // To get the <real content height> we need to subtract padding already
      // added to the content container style and the footer if it's already
      // been rendered:
      // <real content height> = contentHeight - paddingTop - paddingBottom - footerHeight
      //
      // The resulting equation is:
      // footerHeight = fullHeight - <real content height> - TAB_BAR_HEIGHT - paddingBottom
      //              = fullHeight - (contentHeight - paddingTop - paddingBottom - footerHeight) - TAB_BAR_HEIGHT - paddingBottom
      //              = fullHeight + paddingTop + footerHeight - (contentHeight + TAB_BAR_HEIGHT)
      const paddingTopProp = (contentContainerStyle as ViewStyle)?.paddingTop
      const paddingTop = typeof paddingTopProp === 'number' ? paddingTopProp : 0
      let calculatedFooterHeight =
        dimensions.fullHeight + paddingTop + footerHeight.value - (contentHeight + TAB_BAR_HEIGHT)

      // iOS correction (window height is calculated without the top inset on Android)
      // (see this comment: https://stackoverflow.com/questions/44978804/whats-the-difference-between-window-and-screen-in-the-dimensions-api)
      if (IS_IOS) calculatedFooterHeight -= insets.top

      footerHeight.value = Math.max(0, calculatedFooterHeight)
    },
    [footerHeight, contentContainerStyle, insets.top]
  )

  useEffect(() => {
    // Reset footer height to the initial value when the active account changes
    // (the fullHeight value is used for the same reason as the initial value)
    footerHeight.value = dimensions.fullHeight
  }, [activeAccount, footerHeight])

  const footerStyle = useAnimatedStyle(() => ({
    height: footerHeight.value,
  }))

  return {
    onContentSizeChange: contentContainerStyle ? onContentSizeChange : undefined,
    footerHeight,
    adaptiveFooter: <Animated.View style={footerStyle} />,
  }
}
