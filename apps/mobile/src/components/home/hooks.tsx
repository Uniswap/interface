import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { TAB_BAR_HEIGHT } from 'src/components/layout/TabHelpers'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

export function useAdaptiveFooter(contentContainerStyle?: StyleProp<ViewStyle>): {
  onContentSizeChange?: (w: number, h: number) => void
  footerHeight: SharedValue<number>
  adaptiveFooter: JSX.Element
} {
  const { fullHeight } = useDeviceDimensions()
  const insets = useAppInsets()
  const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)

  const HEIGHT_TO_SUBTRACT = isBottomTabsEnabled ? ESTIMATED_BOTTOM_TABS_HEIGHT : TAB_BAR_HEIGHT
  // Content is rendered under the navigation bar but not under the status bar
  const maxContentHeight = fullHeight - insets.top
  // Use maxContentHeight as the initial value to properly position the TabBar
  // while changing tabs when data is loading (before the onContentSizeChange
  // was called and appropriate footer height was calculated)
  const footerHeight = useSharedValue(maxContentHeight)
  const activeAccount = useActiveAccount()

  const onContentSizeChange = useCallback(
    (_: number, contentHeight: number) => {
      if (!contentContainerStyle) {
        return
      }
      // The height of the footer added to the list can be calculated from
      // the following equation (for collapsed tab bar):
      // maxContentHeight = HEIGHT_TO_SUBTRACT + <real content height> + footerHeight + paddingBottom
      //
      // To get the <real content height> we need to subtract padding already
      // added to the content container style and the footer if it's already
      // been rendered:
      // <real content height> = contentHeight - paddingTop - paddingBottom - footerHeight
      //
      // The resulting equation is:
      // footerHeight = maxContentHeight - <real content height> - HEIGHT_TO_SUBTRACT - paddingBottom
      //              = maxContentHeight - (contentHeight - paddingTop - paddingBottom - footerHeight) - HEIGHT_TO_SUBTRACT - paddingBottom
      //              = maxContentHeight + paddingTop + footerHeight - (contentHeight + HEIGHT_TO_SUBTRACT)
      const paddingTopProp = (contentContainerStyle as ViewStyle).paddingTop
      const paddingTop = typeof paddingTopProp === 'number' ? paddingTopProp : 0
      const calculatedFooterHeight =
        maxContentHeight + paddingTop + footerHeight.value - (contentHeight + HEIGHT_TO_SUBTRACT)

      footerHeight.value = Math.max(0, calculatedFooterHeight)
    },
    [contentContainerStyle, maxContentHeight, HEIGHT_TO_SUBTRACT],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to recalculate this when activeAccount changes
  useEffect(() => {
    // Reset footer height to the initial value when the active account changes
    // (the fullHeight value is used for the same reason as the initial value)
    footerHeight.value = fullHeight
  }, [activeAccount, footerHeight, fullHeight])

  const footerStyle = useAnimatedStyle(() => ({
    height: footerHeight.value,
  }))

  const adaptiveFooter = useMemo(() => <Animated.View style={footerStyle} />, [footerStyle])

  return {
    onContentSizeChange: contentContainerStyle ? onContentSizeChange : undefined,
    footerHeight,
    adaptiveFooter,
  }
}
