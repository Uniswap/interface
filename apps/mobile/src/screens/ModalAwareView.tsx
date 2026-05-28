import { BottomSheetDraggableView } from '@gorhom/bottom-sheet'
import React from 'react'
import { View } from 'react-native'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { useIsInModal } from 'src/components/modals/useIsInModal'
import { Flex, flexStyles, useSporeColors } from 'ui/src'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
/**
 * Wrapper view to correctly render screens within Modal as needed. This is required
 * to enable both full screen, and bottom sheet drag gestures on a screen within a modal.
 *
 * Note: full screen gesture must be enable in the root navigator to work.
 *
 * This is not needed on screens that make use of bottom sheet compatible views (like HeaderScrollScreen, which
 * uses a compatible virtualized list when rendered within a bottom sheet modal).
 */
export function ExploreModalAwareView({ children }: { children: JSX.Element }): JSX.Element {
  const inModal = useIsInModal(ModalName.Explore)
  const colors = useSporeColors()
  const insets = useAppInsets()

  if (inModal) {
    return (
      <View style={flexStyles.fill}>
        <Flex left={0} position="absolute" right={0} top={insets.top} zIndex="$fixed">
          <HandleBar backgroundColor={colors.transparent.val} />
        </Flex>
        <BottomSheetDraggableView style={flexStyles.fill}>{children}</BottomSheetDraggableView>
        <HorizontalEdgeGestureTarget />
      </View>
    )
  }

  return <View style={flexStyles.fill}>{children}</View>
}
