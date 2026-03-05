import { useState, useSyncExternalStore } from 'react'
import { Flex, FlexProps } from 'ui/src'
import type { SharedValue } from 'ui/src/animations'

type ScrollbarProps = FlexProps & {
  visibleHeight: number
  contentHeight: number
  scrollOffset: SharedValue<number>
}

// Create a subscription function for shared value polling
function createSharedValueStore(sharedValue: SharedValue<number>): {
  subscribe: (callback: () => void) => () => void
  getSnapshot: () => number
} {
  let lastValue = sharedValue.value
  let intervalId: ReturnType<typeof setInterval> | null = null
  const listeners = new Set<() => void>()

  return {
    subscribe: (callback: () => void): (() => void) => {
      listeners.add(callback)

      // Start polling only when we have listeners
      if (listeners.size === 1 && intervalId === null) {
        intervalId = setInterval(() => {
          const currentValue = sharedValue.value
          if (currentValue !== lastValue) {
            lastValue = currentValue
            listeners.forEach((listener) => listener())
          }
        }, 16) // ~60fps
      }

      return () => {
        listeners.delete(callback)
        // Stop polling when no listeners remain
        if (listeners.size === 0 && intervalId !== null) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    },
    getSnapshot: () => sharedValue.value,
  }
}

/**
 * Web implementation of Scrollbar using CSS-based positioning.
 * Uses useSyncExternalStore pattern to subscribe to shared value changes.
 */
export function Scrollbar({ visibleHeight, contentHeight, scrollOffset, ...rest }: ScrollbarProps): JSX.Element {
  const [scrollbarHeight, setScrollbarHeight] = useState(0)

  // Create store for the shared value - memoized per scrollOffset instance
  const [store] = useState(() => createSharedValueStore(scrollOffset))
  const scrollOffsetValue = useSyncExternalStore(store.subscribe, store.getSnapshot)

  const thumbHeight = (visibleHeight / contentHeight) * scrollbarHeight
  const maxScroll = contentHeight - visibleHeight
  const maxThumbTop = scrollbarHeight - thumbHeight
  const thumbTop = maxScroll > 0 ? (scrollOffsetValue / maxScroll) * maxThumbTop : 0
  const clampedThumbTop = Math.max(0, Math.min(thumbTop, maxThumbTop))

  return (
    <Flex
      animation="quicker"
      enterStyle={{
        opacity: 0,
        width: 0,
      }}
      width={6}
      {...rest}
    >
      <Flex
        fill
        onLayout={({
          nativeEvent: {
            layout: { height },
          },
        }) => {
          setScrollbarHeight(height)
        }}
      >
        <Flex
          position="absolute"
          top={clampedThumbTop}
          height={thumbHeight}
          width="100%"
          style={{
            transition: 'top 0.1s ease-out',
          }}
        >
          <Flex fill backgroundColor="$neutral3" borderRadius="$rounded12" />
        </Flex>
      </Flex>
    </Flex>
  )
}
