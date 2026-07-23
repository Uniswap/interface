import { useMemo } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { TAB_STYLES } from 'src/components/layout/TabHelpers'
import { spacing } from 'ui/src/theme'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

/** Feed scroll FlatList `contentContainerStyle` (bottom tab clearance + list padding). */
export function useFeedScrollContentContainerStyle(): StyleProp<ViewStyle> {
  const insets = useAppInsets()

  return useMemo(
    () => ({
      paddingTop: TAB_STYLES.tabListInner.paddingTop,
      paddingBottom:
        insets.bottom + ESTIMATED_BOTTOM_TABS_HEIGHT + TAB_STYLES.tabListInner.paddingBottom + spacing.spacing12,
    }),
    [insets.bottom],
  )
}
