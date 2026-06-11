import { memo, useCallback, type ReactNode } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { View } from 'react-native'

interface TabMeasuredLayoutProps {
  children: ReactNode
  onHeightChange: (height: number) => void
  testID?: string
}

/** Measures tab content height for HomeFeedPager. */
export const TabMeasuredLayout = memo(function TabMeasuredLayoutInner({
  children,
  onHeightChange,
  testID,
}: TabMeasuredLayoutProps): JSX.Element {
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onHeightChange(e.nativeEvent.layout.height)
    },
    [onHeightChange],
  )

  return (
    <View collapsable={false} testID={testID} onLayout={handleLayout}>
      {children}
    </View>
  )
})
