import { memo, useCallback, useEffect, useMemo } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  interpolateColor,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { useAutoScrollContext } from 'src/components/sortableGrid/contexts/AutoScrollContextProvider'
import { useDragContext } from 'src/components/sortableGrid/contexts/DragContextProvider'
import { useLayoutContext } from 'src/components/sortableGrid/contexts/LayoutContextProvider'
import {
  ACTIVATE_PAN_ANIMATION_DELAY,
  ITEM_ANIMATION_DURATION,
  OFFSET_EPS,
  TIME_TO_ACTIVATE_PAN,
} from 'src/components/sortableGrid/internal/constants'
import { useItemPosition } from 'src/components/sortableGrid/internal/hooks'
import { GridItemExiting } from 'src/components/sortableGrid/internal/layoutAnimations'
import { getItemZIndex } from 'src/components/sortableGrid/internal/utils'
import { SortableGridRenderItem } from 'src/components/sortableGrid/types'

type SortableGridItemProps<I> = {
  item: I
  itemKey: string
  renderItem: SortableGridRenderItem<I>
  numColumns: number
}

function SortableGridItem<I>({ item, itemKey, renderItem, numColumns }: SortableGridItemProps<I>): JSX.Element {
  const {
    measuredItemsCount,
    targetContainerHeight,
    initialRenderCompleted,
    appliedContainerHeight,
    itemDimensions,
    itemPositions,
    columnWidth,
  } = useLayoutContext()
  const {
    activeItemScale,
    activeItemOpacity,
    activeItemShadowOpacity,
    activeItemPosition,
    activationProgress,
    activeItemDropped,
    activeItemKey,
    editable,
  } = useDragContext()
  const { scrollY, startScrollOffset } = useAutoScrollContext()

  const isTouched = useSharedValue(false)
  const isActive = useDerivedValue(() => activeItemKey.value === itemKey)
  const itemHeight = useDerivedValue(() => itemDimensions.value[itemKey]?.height ?? 0)
  const pressProgress = useSharedValue(0)

  const position = useItemPosition(itemKey)
  const dragStartPosition = useSharedValue({ x: 0, y: 0 })
  const targetItemPosition = useDerivedValue(() => itemPositions.value[itemKey])

  useEffect(() => {
    return (): void => {
      // Remove item dimensions when the item is unmounted
      runOnUI((key: string) => {
        delete itemDimensions.value[key]
        measuredItemsCount.value -= 1
        // If was active, reset active item key
        if (activeItemKey.value === key) {
          activeItemKey.value = null
        }
      })(itemKey)
    }
  }, [itemKey, activeItemKey, itemDimensions, measuredItemsCount])

  const measureItem = useCallback(
    ({
      nativeEvent: {
        layout: { width, height },
      },
    }: LayoutChangeEvent) => {
      runOnUI((key: string) => {
        // Store item dimensions without re-creating the dimensions object
        if (!itemDimensions.value[key]) {
          measuredItemsCount.value += 1
        }
        itemDimensions.value[key] = { width, height }
      })(itemKey)
    },
    [itemKey, itemDimensions, measuredItemsCount],
  )

  const handleDragEnd = useCallback(() => {
    'worklet'
    isTouched.value = false
    activeItemKey.value = null
    pressProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN })
    activationProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN }, () => {
      activeItemDropped.value = true
    })
  }, [activationProgress, activeItemDropped, activeItemKey, isTouched, pressProgress])

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(TIME_TO_ACTIVATE_PAN)
        .onTouchesDown(() => {
          isTouched.value = true
          const progress = withDelay(
            ACTIVATE_PAN_ANIMATION_DELAY,
            withTiming(1, { duration: TIME_TO_ACTIVATE_PAN - ACTIVATE_PAN_ANIMATION_DELAY }),
          )
          pressProgress.value = progress
          activationProgress.value = progress
        })
        .onStart(() => {
          if (!isTouched.value) {
            return
          }
          dragStartPosition.value = activeItemPosition.value = {
            x: position.x.value ?? 0,
            y: position.y.value ?? 0,
          }
          activeItemKey.value = itemKey
          startScrollOffset.value = scrollY.value
          activeItemDropped.value = false
        })
        .onUpdate((e) => {
          if (!isActive.value) {
            return
          }
          activeItemPosition.value = {
            x: dragStartPosition.value.x + e.translationX,
            y: dragStartPosition.value.y + e.translationY,
          }
        })
        .onFinalize(handleDragEnd)
        .enabled(editable),
    [
      editable,
      activationProgress,
      activeItemDropped,
      activeItemKey,
      activeItemPosition,
      dragStartPosition,
      handleDragEnd,
      isActive,
      isTouched,
      itemKey,
      position,
      pressProgress,
      scrollY,
      startScrollOffset,
    ],
  )

  // ITEM POSITIONING AND ANIMATION
  const animatedItemStyle = useAnimatedStyle(() => {
    // INITIAL RENDER
    // (relative placements - no absolute positioning yet)
    // This ensures there is no blank space when grid items are being measured
    if (!initialRenderCompleted.value || appliedContainerHeight.value === -1 || columnWidth.value === -1) {
      return {
        width: `${100 / numColumns}%`,
      }
    }

    const x = position.x.value
    const y = position.y.value

    // ADDED ITEM AFTER INITIAL RENDER
    // (item is not yet measured -> don't render it)
    // This ensures the item is not misplaced when it is added to the grid
    if (
      x === null ||
      y === null ||
      // If the item bottom edge is rendered below the container bottom edge
      (y + itemHeight.value - appliedContainerHeight.value > OFFSET_EPS &&
        // And the container height is lower than the target height
        targetContainerHeight.value - appliedContainerHeight.value > OFFSET_EPS &&
        // And the item is not being dragged
        !isActive.value)
    ) {
      return {
        pointerEvents: 'none',
        position: 'absolute',
        transform: [{ scale: 0.5 }],
        opacity: 0,
        width: columnWidth.value,
      }
    }

    // ABSOLUTE POSITIONING
    // (item is measured and rendered)
    // This ensures the item is rendered in the correct position and responds
    // to grid items order changes and drag events
    return {
      pointerEvents: 'auto',
      position: 'absolute',
      opacity: withTiming(1, { duration: ITEM_ANIMATION_DURATION }),
      transform: [{ scale: withTiming(1, { duration: ITEM_ANIMATION_DURATION }) }],
      top: y,
      left: x,
      width: columnWidth.value,
      zIndex: getItemZIndex(isActive.value, pressProgress.value, { x, y }, targetItemPosition.value),
    }
  })

  // ITEM DECORATION
  // (only for the active item being dragged)
  const animatedItemDecorationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressProgress.value, [0, 1], [1, activeItemScale.value]) }],
    opacity: interpolate(pressProgress.value, [0, 1], [1, activeItemOpacity.value]),
    shadowColor: interpolateColor(
      pressProgress.value,
      [0, 1],
      ['transparent', `rgba(0, 0, 0, ${activeItemShadowOpacity.value})`],
    ),
  }))

  const content = useMemo(
    () =>
      renderItem({
        item,
        pressProgress,
        dragActivationProgress: activationProgress,
      }),
    [item, renderItem, activationProgress, pressProgress],
  )

  return (
    <Animated.View exiting={GridItemExiting} pointerEvents="box-none" style={animatedItemStyle} onLayout={measureItem}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedItemDecorationStyle}>{content}</Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

export default memo(SortableGridItem) as typeof SortableGridItem
