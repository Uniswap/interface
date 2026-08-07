import { ReactNode, useCallback, useRef, useState } from 'react'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { Flex, LinearGradient, ScrollView } from 'ui/src'

const FADE_WIDTH = 24
// Ignore sub-pixel rounding when deciding whether an edge is clipped.
const EDGE_EPSILON = 1

/**
 * Horizontal ScrollView whose edge fades render conditionally: the left fade appears once the
 * row is scrolled away from the start, the right fade only while content overflows past the
 * visible edge (Figma 750:13034/13933). Shared by the V2 chip and pill rows.
 */
export function HorizontalFadeScroll({ children }: { children: ReactNode }): JSX.Element {
  const contentWidthRef = useRef(0)
  const layoutWidthRef = useRef(0)
  const scrollXRef = useRef(0)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateFades = useCallback(() => {
    setCanScrollLeft(scrollXRef.current > EDGE_EPSILON)
    setCanScrollRight(scrollXRef.current + layoutWidthRef.current < contentWidthRef.current - EDGE_EPSILON)
  }, [])

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollXRef.current = event.nativeEvent.contentOffset.x
      layoutWidthRef.current = event.nativeEvent.layoutMeasurement.width
      contentWidthRef.current = event.nativeEvent.contentSize.width
      updateFades()
    },
    [updateFades],
  )

  const onContentSizeChange = useCallback(
    (width: number) => {
      contentWidthRef.current = width
      updateFades()
    },
    [updateFades],
  )

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      layoutWidthRef.current = event.nativeEvent.layout.width
      updateFades()
    },
    [updateFades],
  )

  return (
    <Flex position="relative">
      <ScrollView
        horizontal
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        onScroll={onScroll}
      >
        {children}
      </ScrollView>
      {canScrollLeft && (
        <LinearGradient
          colors={['$surface1', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          height="100%"
          left={0}
          pointerEvents="none"
          position="absolute"
          top={0}
          width={FADE_WIDTH}
        />
      )}
      {canScrollRight && (
        <LinearGradient
          colors={['transparent', '$surface1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          height="100%"
          pointerEvents="none"
          position="absolute"
          right={0}
          top={0}
          width={FADE_WIDTH}
        />
      )}
    </Flex>
  )
}
