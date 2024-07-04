import { useCallback, useRef } from 'react'
import { SharedValue, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'
import { useAutoScrollContext, useDragContext, useLayoutContext } from 'src/components/sortableGrid/contexts'
import { getColumnIndex, getRowIndex } from 'src/components/sortableGrid/utils'
import { HapticFeedback, ImpactFeedbackStyle } from 'ui/src'

export function useStableCallback<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends (...args: Array<any>) => any,
>(callback?: C): C {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    (...args: Array<any>) => callbackRef.current?.(...args),
    [],
  ) as C
}

export function useItemPosition(key: string): {
  x: SharedValue<number | null>
  y: SharedValue<number | null>
} {
  const { itemPositions } = useLayoutContext()
  const { activeItemKey, activeItemPosition } = useDragContext()
  const { scrollOffsetDiff } = useAutoScrollContext()

  const x = useSharedValue<number | null>(null)
  const y = useSharedValue<number | null>(null)

  useAnimatedReaction(
    () => ({
      position: itemPositions.value[key],
      isActive: activeItemKey.value === key,
    }),
    ({ position, isActive }) => {
      if (!position || isActive) {
        return
      }
      x.value = x.value === null ? position.x : withTiming(position.x)
      y.value = y.value === null ? position.y : withTiming(position.y)
    },
    [key],
  )

  useAnimatedReaction(
    () => ({
      position: activeItemPosition.value,
      offsetDiff: scrollOffsetDiff.value,
    }),
    ({ position, offsetDiff }) => {
      if (activeItemKey.value === key) {
        x.value = position.x
        y.value = position.y + offsetDiff
      }
    },
  )

  return { x, y }
}

export function useItemOrderUpdater(numColumns: number, hapticFeedback: boolean): void {
  const { keyToIndex, indexToKey, rowOffsets, targetContainerHeight, itemDimensions } = useLayoutContext()
  const { activeItemKey, activeItemPosition } = useDragContext()
  const { scrollOffsetDiff } = useAutoScrollContext()

  const vibrate = useCallback(async () => {
    await HapticFeedback.impact(ImpactFeedbackStyle.Light)
  }, [])

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      activePosition: activeItemPosition.value,
      offsetDiff: scrollOffsetDiff.value,
    }),
    ({ activeKey, activePosition, offsetDiff }) => {
      if (activeKey === null) {
        return
      }
      const dimensions = itemDimensions.value[activeKey]
      if (!dimensions) {
        return
      }

      const centerY = activePosition.y + dimensions.height / 2 + offsetDiff
      const centerX = activePosition.x + dimensions.width / 2
      const activeIndex = keyToIndex.value[activeKey]
      const itemsCount = indexToKey.value.length

      if (activeIndex === undefined) {
        return
      }

      const rowIndex = getRowIndex(activeIndex, numColumns)
      const columnIndex = getColumnIndex(activeIndex, numColumns)

      // Get active item bounding box
      const yOffsetAbove = rowOffsets.value[rowIndex]
      if (yOffsetAbove === undefined) {
        return
      }
      const yOffsetBelow = rowOffsets.value[rowIndex + 1]
      const xOffsetLeft = columnIndex * dimensions.width
      const xOffsetRight = (columnIndex + 1) * dimensions.width

      // Check if the center of the active item is over the top or bottom edge of the container
      let dy = 0
      if (yOffsetAbove > 0 && centerY < yOffsetAbove) {
        dy = -1
      } else if (yOffsetBelow !== undefined && yOffsetBelow < targetContainerHeight.value && centerY > yOffsetBelow) {
        dy = 1
      }

      // Check if the center of the active item is over the left or right edge of the container
      let dx = 0
      if (xOffsetLeft > 0 && centerX < xOffsetLeft) {
        dx = -1
      } else if (columnIndex < numColumns - 1 && activeIndex < itemsCount && centerX > xOffsetRight) {
        dx = 1
      }

      const indexOffset = dy * numColumns + dx
      // Swap the active item with the item at the new index
      const newIndex = activeIndex + indexOffset
      if (newIndex === activeIndex || newIndex < 0 || newIndex >= itemsCount) {
        return
      }

      // Swap the order of the current item and the active item
      if (newIndex < activeIndex) {
        indexToKey.value = [
          ...indexToKey.value.slice(0, newIndex),
          activeKey,
          ...indexToKey.value.slice(newIndex, activeIndex),
          ...indexToKey.value.slice(activeIndex + 1),
        ]
      } else {
        indexToKey.value = [
          ...indexToKey.value.slice(0, activeIndex),
          ...indexToKey.value.slice(activeIndex + 1, newIndex + 1),
          activeKey,
          ...indexToKey.value.slice(newIndex + 1),
        ]
      }

      if (hapticFeedback) {
        runOnJS(vibrate)()
      }
    },
    [hapticFeedback],
  )
}
