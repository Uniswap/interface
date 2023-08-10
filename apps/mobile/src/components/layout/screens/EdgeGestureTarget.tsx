import React from 'react'
import { Box } from 'src/components/layout'
import { dimensions } from 'ui/src/theme/restyle/sizing'

/**
 * Adds a transparent box to the specific edge as a gesture target.
 * Useful when rendering `BottomSheetFlatList`s inside a navigator.
 */
export function HorizontalEdgeGestureTarget({
  edge = 'left',
  height = dimensions.fullHeight,
  top = 0,
  width = 20,
}: {
  edge?: 'left' | 'right'
  height?: number
  top?: number
  width?: number
}): JSX.Element {
  return (
    <Box
      bg="accent1"
      height={height}
      left={edge === 'left' ? 0 : undefined}
      opacity={0}
      position="absolute"
      right={edge === 'right' ? 0 : undefined}
      top={top}
      width={width}
    />
  )
}
