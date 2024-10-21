import { PropsWithChildren, createContext, useContext, useMemo, useRef } from 'react'
import { View } from 'react-native'
import { runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { useDragContext } from 'src/components/sortableGrid/contexts/DragContextProvider'
import { useLayoutContext } from 'src/components/sortableGrid/contexts/LayoutContextProvider'
import { AUTO_SCROLL_THRESHOLD } from 'src/components/sortableGrid/internal/constants'
import { useStableCallback } from 'src/components/sortableGrid/internal/utils'
import { AutoScrollContextType, AutoScrollProps } from 'src/components/sortableGrid/types'

const AutoScrollContext = createContext<AutoScrollContextType | null>(null)

export function useAutoScrollContext(): AutoScrollContextType {
  const context = useContext(AutoScrollContext)

  if (!context) {
    throw new Error('useAutoScrollContext must be used within a AutoScrollProvider')
  }

  return context
}

export type AutoScrollProviderProps = PropsWithChildren<Omit<AutoScrollProps, 'containerRef'>>

export function AutoScrollProvider({
  children,
  scrollableRef,
  scrollY: scrollYValue,
  visibleHeight: visibleHeightValue,
}: AutoScrollProviderProps): JSX.Element {
  const { itemDimensions, targetContainerHeight } = useLayoutContext()
  const { activeItemKey, activeItemPosition } = useDragContext()

  /**
   * VARIABLES
   */
  // HELPER VARIABLES
  const scrollTarget = useSharedValue(0)
  const scrollDirection = useSharedValue(0) // 1 = down, -1 = up
  const activeItemHeight = useDerivedValue(
    () => (activeItemKey.value ? itemDimensions.value[activeItemKey.value]?.height : -1) ?? -1,
  )

  // REFS
  const gridContainerRef = useRef<View>(null)

  // MEASUREMENTS
  // Values used to scroll the container to the proper offset
  // (updated from the SortableGridInner component)
  const containerStartOffset = useSharedValue(0)
  const containerEndOffset = useDerivedValue(() => containerStartOffset.value + targetContainerHeight.value)

  const startScrollOffset = useSharedValue(0)
  const scrollOffsetDiff = useDerivedValue(() =>
    activeItemKey.value === null ? 0 : scrollYValue.value - startScrollOffset.value,
  )

  /**
   * HANDLERS
   */
  const scrollToOffset = useStableCallback((offset: number) => {
    const scrollable = scrollableRef.current
    if (!scrollable || activeItemKey.value === null) {
      return
    }

    if ('scrollTo' in scrollable) {
      scrollable.scrollTo({ y: offset, animated: true })
    } else {
      scrollable.scrollToOffset({ offset, animated: true })
    }
  })

  /**
   * REACTIONS
   */
  // Reset scroll properties when the active item changes
  useAnimatedReaction(
    () => activeItemKey.value,
    () => {
      // Reset when the active index changes
      scrollDirection.value = 0
    },
  )

  // AUTO SCROLL HANDLER
  // Automatically scrolls the container when the active item is near the edge
  useAnimatedReaction(
    () => {
      if (activeItemHeight.value === -1) {
        return null
      }

      return {
        itemAbsoluteY: activeItemPosition.value.y + containerStartOffset.value + scrollOffsetDiff.value,
        activeHeight: activeItemHeight.value,
        minOffset: containerStartOffset.value,
        maxOffset: containerEndOffset.value - visibleHeightValue.value,
        visibleHeight: visibleHeightValue.value,
        scrollY: scrollYValue.value,
      }
    },
    (props) => {
      if (!props) {
        return
      }
      const { itemAbsoluteY, scrollY, minOffset, maxOffset, activeHeight, visibleHeight } = props

      let currentScrollTarget = scrollTarget.value
      let currentScrollDirection = scrollDirection.value

      /**
       * |----------------------|
       * | content above grid   |
       * |----------------------| <- minOffset (- threshold to scroll a bit above the grid)
       * | invisible grid above |
       * | (optional)           | - if the scrollable container was scrolled down
       * |----------------------|
       * | visible grid part    |
       * |----------------------|
       * | invisible grid below | - if the scrollable container was scrolled up enough
       * | (optional)           |
       * |----------------------| <- maxOffset (+ threshold to scroll a bit below the grid)
       * | content below grid   |
       * |----------------------|
       */
      // If the active item is above the current scroll position (with small threshold
      // to start scrolling earlier) and the scroll position is not at the top of the
      // grid, scroll up
      if (itemAbsoluteY < scrollY + AUTO_SCROLL_THRESHOLD && scrollY > minOffset - AUTO_SCROLL_THRESHOLD) {
        currentScrollTarget = Math.max(minOffset - AUTO_SCROLL_THRESHOLD, scrollY - activeHeight)
        currentScrollDirection = -1
      }
      // If the active item is below the current scroll position (with small threshold
      // to start scrolling earlier) and the scroll position is not at the bottom of the
      // grid, scroll down
      else if (
        itemAbsoluteY + activeHeight > scrollY + visibleHeight - AUTO_SCROLL_THRESHOLD &&
        scrollY < maxOffset + AUTO_SCROLL_THRESHOLD
      ) {
        currentScrollTarget = Math.min(maxOffset + AUTO_SCROLL_THRESHOLD, scrollY + activeHeight)
        currentScrollDirection = 1
      }

      const scrollDiff = Math.abs(currentScrollTarget - scrollTarget.value)

      if (
        // Don't scroll if the difference is too small (limit JS thread updates that
        // become laggy when too many are triggered) and the scroll direction is the same
        // as before and the scroll target is still far enough from the min/max offset
        (scrollDiff < 0.75 * activeHeight &&
          currentScrollDirection === scrollDirection.value &&
          currentScrollTarget > minOffset - AUTO_SCROLL_THRESHOLD &&
          currentScrollTarget < maxOffset + AUTO_SCROLL_THRESHOLD) ||
        // Don't scroll if the difference is too small and the target can be considered
        // reached
        Math.abs(scrollDiff) < 2
      ) {
        return
      }

      scrollDirection.value = currentScrollDirection
      scrollTarget.value = currentScrollTarget
      runOnJS(scrollToOffset)(currentScrollTarget)
    },
  )

  /**
   * CONTEXT VALUE
   */
  const contextValue = useMemo(
    () => ({
      gridContainerRef,
      containerStartOffset,
      containerEndOffset,
      scrollOffsetDiff,
      startScrollOffset,
      scrollY: scrollYValue,
    }),
    [gridContainerRef, containerStartOffset, containerEndOffset, scrollOffsetDiff, startScrollOffset, scrollYValue],
  )

  return <AutoScrollContext.Provider value={contextValue}>{children}</AutoScrollContext.Provider>
}
