import React from 'react'
import { Flex } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'

/**
 * Adds a transparent box to the specific edge as a gesture target.
 * Useful when rendering `BottomSheetFlatList`s inside a navigator.
 */
export function HorizontalEdgeGestureTarget({
  edge = 'left',
  height,
  top = 0,
  width = 20,
}: {
  edge?: 'left' | 'right'
  height?: number
  top?: number
  width?: number
}): JSX.Element {
  const dimensions = useDeviceDimensions()

  return (
    <Flex
      backgroundColor="$accent1"
      height={height ?? dimensions.fullHeight}
      left={edge === 'left' ? 0 : undefined}
      opacity={0}
      position="absolute"
      right={edge === 'right' ? 0 : undefined}
      top={top}
      width={width}
    />
  )
}
