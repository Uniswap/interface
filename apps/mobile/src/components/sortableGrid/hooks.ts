import { useCallback, useRef } from 'react'
import { FlatList, ScrollView } from 'react-native'
import { SharedValue, runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated'
import { useSortableGridContext } from './SortableGridProvider'
import { AUTO_SCROLL_THRESHOLD } from './constants'
import { ItemMeasurements } from './types'

export function useStableCallback<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends (...args: Array<any>) => any
>(callback?: C): C {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    (...args: Array<any>) => callbackRef.current?.(...args),
    []
  ) as C
}

export function useAnimatedZIndex(renderIndex: number): SharedValue<number> {
  const { touchedIndex: touchedIndexValue, previousActiveIndex: previousActiveIndexValue } =
    useSortableGridContext()
  const zIndexValue = useSharedValue(0)

  useAnimatedReaction(
    () => ({
      touchedIndex: touchedIndexValue.value,
      previousActiveIndex: previousActiveIndexValue.value,
    }),
    ({ touchedIndex, previousActiveIndex }) => {
      if (touchedIndex === null) {
        return null
      }
      if (renderIndex === touchedIndex) {
        // Display the currently touched item on top of all other items
        zIndexValue.value = 10000
      } else if (renderIndex === previousActiveIndex) {
        // Display the previously active item on top of other items
        // except the currently touched item (used to properly position
        // items before their drop animations finishes)
        zIndexValue.value = 9999
      } else {
        zIndexValue.value = 0
      }
    }
  )

  return zIndexValue
}

export function useItemOrderUpdater(
  renderIndex: number,
  activeRenderIndex: number | null,
  displayIndexValue: SharedValue<number>,
  numColumns: number
): void {
  const {
    touchedIndex: touchedIndexValue,
    activeTranslation: activeTranslationValue,
    itemAtIndexMeasurements: itemAtIndexMeasurementsValue,
    displayToRenderIndex: displayToRenderIndexValue,
    renderIndexToDisplayIndex: renderIndexToDisplayIndexValue,
    scrollOffsetDiff: scrollOffsetDiffValue,
  } = useSortableGridContext()

  useAnimatedReaction(
    () => ({
      activeTranslation: activeTranslationValue.value,
      displayIndex: displayIndexValue.value,
      scrollOffsetDiff: scrollOffsetDiffValue.value,
      touchedIndex: touchedIndexValue.value,
    }),
    ({ displayIndex, activeTranslation, scrollOffsetDiff, touchedIndex }) => {
      // Return if there is no active item or the current item is the active item
      // (only active item neighbors decide if the order should be updated)
      if (
        activeRenderIndex === null ||
        touchedIndex === null ||
        activeRenderIndex === renderIndex
      ) {
        return
      }

      const itemAtIndexMeasurements = itemAtIndexMeasurementsValue.value
      // The current item might have moved so we get its measurements based on
      // the display index (e.g. if the item that is at index 0 in the data array
      // was moved to index 1, its current offset is determined by the cell that
      // is at index 1 in the grid)
      const itemMeasurements = itemAtIndexMeasurements[displayIndex]
      // For the active item, we always use the render index to get the measurements
      // as the activeTranslation is calculated in relation to the render position
      const activeItemMeasurements = itemAtIndexMeasurements[activeRenderIndex]
      if (!itemMeasurements || !activeItemMeasurements) {
        return
      }

      // Active item data
      const activeAbsoluteX = activeItemMeasurements.x + activeTranslation.x
      const activeAbsoluteY = activeItemMeasurements.y + activeTranslation.y
      const activeWidth = activeItemMeasurements.width
      const activeHeight = activeItemMeasurements.height

      // Current item data
      const itemAbsoluteX = itemMeasurements.x
      const itemAbsoluteY = itemMeasurements.y - scrollOffsetDiff
      const itemWidth = itemMeasurements.width
      const itemHeight = itemMeasurements.height

      //
      // Check if the current element is on the boundary of the container
      //
      const renderIndexToDisplayIndex = renderIndexToDisplayIndexValue.value

      const itemsCount = renderIndexToDisplayIndex.length
      const columnIndex = displayIndex % numColumns
      const rowIndex = Math.floor(displayIndex / numColumns)
      const itemsInColumnCount =
        Math.floor(itemsCount / numColumns) + (columnIndex < itemsCount % numColumns ? 1 : 0)

      const isInFirstRow = displayIndex < numColumns
      const isLastInColumn = rowIndex === itemsInColumnCount - 1
      const isInLastColumn = columnIndex === numColumns - 1
      const isInFirstColumn = columnIndex === 0

      // Return if the active item is not overlapping the current item
      // by at least 50% in any direction (with the exception of the boundary items)
      if (
        // Right neighbor of the active item
        (activeAbsoluteX + activeWidth < itemAbsoluteX + itemWidth / 2 && !isInFirstColumn) ||
        // Left neighbor of the active item
        (activeAbsoluteX > itemAbsoluteX + itemWidth / 2 && !isInLastColumn) ||
        // Bottom neighbor of the active item
        (activeAbsoluteY + activeHeight < itemAbsoluteY + itemHeight / 2 && !isInFirstRow) ||
        // Top neighbor of the active item
        (activeAbsoluteY > itemAbsoluteY + itemHeight / 2 && !isLastInColumn)
      ) {
        return
      }

      const displayToRenderIndex = displayToRenderIndexValue.value
      const activeDisplayIndex = renderIndexToDisplayIndex[activeRenderIndex]
      if (activeDisplayIndex === undefined) {
        return
      }

      //
      // Swap the order of the current item and the active item
      //
      if (displayIndex < activeDisplayIndex) {
        // Insert the current item before the active item
        displayToRenderIndexValue.value = [
          ...displayToRenderIndex.slice(0, displayIndex),
          activeRenderIndex,
          ...displayToRenderIndex.slice(displayIndex, activeDisplayIndex),
          ...displayToRenderIndex.slice(activeDisplayIndex + 1),
        ]
      } else {
        // Insert the current item after the active item
        displayToRenderIndexValue.value = [
          ...displayToRenderIndex.slice(0, activeDisplayIndex),
          ...displayToRenderIndex.slice(activeDisplayIndex + 1, displayIndex + 1),
          activeRenderIndex,
          ...displayToRenderIndex.slice(displayIndex + 1),
        ]
      }
    },
    [renderIndex, activeRenderIndex]
  )
}

export function useAutoScroll(
  activeIndex: number | null,
  touchedIndex: SharedValue<number | null>,
  itemAtIndexMeasurements: SharedValue<Record<number, ItemMeasurements>>,
  activeTranslation: SharedValue<{ x: number; y: number }>,
  scrollOffsetDiff: SharedValue<number>,
  containerStartOffset: SharedValue<number>,
  containerEndOffset: SharedValue<number>,
  visibleHeightValue: SharedValue<number>,
  scrollYValue: SharedValue<number>,
  scrollableRef: React.RefObject<ScrollView | FlatList>
): void {
  const scrollTarget = useSharedValue(0)
  const scrollDirection = useSharedValue(0) // 1 = down, -1 = up

  const scrollToOffset = useStableCallback((offset: number) => {
    const scrollable = scrollableRef.current
    if (!scrollable || touchedIndex.value === null) {
      return
    }

    if ('scrollTo' in scrollable) {
      scrollable.scrollTo({ y: offset, animated: true })
    } else {
      scrollable.scrollToOffset({ offset, animated: true })
    }
  })

  useAnimatedReaction(
    () => touchedIndex.value,
    () => {
      // Reset when the active index changes
      scrollDirection.value = 0
    }
  )

  useAnimatedReaction(
    () => {
      if (activeIndex === null) {
        return null
      }
      const activeMeasurements = itemAtIndexMeasurements.value[activeIndex]
      if (!activeMeasurements) {
        return null
      }

      return {
        itemAbsoluteY:
          activeMeasurements.y +
          activeTranslation.value.y +
          containerStartOffset.value +
          scrollOffsetDiff.value,
        activeHeight: activeMeasurements.height,
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
      if (
        itemAbsoluteY < scrollY + AUTO_SCROLL_THRESHOLD &&
        scrollY > minOffset - AUTO_SCROLL_THRESHOLD
      ) {
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
    [activeIndex]
  )
}
