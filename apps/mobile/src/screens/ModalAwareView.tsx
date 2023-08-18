import { BottomSheetDraggableView } from '@gorhom/bottom-sheet'
import React from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { HandleBar } from 'src/components/modals/HandleBar'
import { selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { flex } from 'ui/src/theme/restyle'
/**
 * Wrapper view to correctly render screens within BottomSheetModal as needed. This is required
 * to enable both full screen, and bottom sheet drag gestures on a screen within a modal.
 *
 * Note: full screen gesture must be enable in the root navigator to work.
 *
 * This is not needed on screens that make use of bottom sheet compatible views (like HeaderScrollScreen, which
 * uses a compatible virtualized list when rendered within a bottom sheet modal).
 */
export function ExploreModalAwareView({ children }: { children: JSX.Element }): JSX.Element {
  const inModal = useAppSelector(selectModalState(ModalName.Explore)).isOpen
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()

  if (inModal) {
    return (
      <View style={flex.fill}>
        <Flex left={0} position="absolute" right={0} top={insets.top} zIndex="fixed">
          <HandleBar backgroundColor={theme.colors.none} />
        </Flex>
        <BottomSheetDraggableView style={flex.fill}>{children}</BottomSheetDraggableView>
        <HorizontalEdgeGestureTarget />
      </View>
    )
  }

  return <View style={flex.fill}>{children}</View>
}
