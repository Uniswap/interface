import { BottomSheetDraggableView } from '@gorhom/bottom-sheet'
import React from 'react'
import { View } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Flex, flexStyles, useDeviceInsets, useSporeColors } from 'ui/src'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'
import { ModalName } from 'wallet/src/telemetry/constants'
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
  const colors = useSporeColors()
  const insets = useDeviceInsets()

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
