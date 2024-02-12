import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { MeasureLayoutOnSuccessCallback, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  useWorkletCallback,
  withTiming,
} from 'react-native-reanimated'
import ActiveItemDecoration from './ActiveItemDecoration'
import { useSortableGridContext } from './SortableGridProvider'
import { TIME_TO_ACTIVATE_PAN } from './constants'
import { useAnimatedZIndex, useItemOrderUpdater } from './hooks'
import { SortableGridRenderItem } from './types'

type SortableGridItemProps<I> = {
  item: I
  index: number
  renderItem: SortableGridRenderItem<I>
  numColumns: number
}

function SortableGridItem<I>({
  item,
  index: renderIndex,
  renderItem,
  numColumns,
}: SortableGridItemProps<I>): JSX.Element {
  const viewRef = useRef<Animated.View>(null)

  // Current state
  const {
    gridContainerRef,
    activeIndex,
    activeTranslation: activeTranslationValue,
    itemAtIndexMeasurements: itemAtIndexMeasurementsValue,
    renderIndexToDisplayIndex,
    touchedIndex,
    editable,
    dragActivationProgress,
    setActiveIndex,
    previousActiveIndex,
    scrollOffsetDiff,
  } = useSortableGridContext()

  const isActive = activeIndex === renderIndex
  const isActiveValue = useSharedValue(isActive)
  const isTouched = useDerivedValue(() => touchedIndex.value === renderIndex)

  useEffect(() => {
    isActiveValue.value = isActive
  }, [isActive, isActiveValue])

  // Cell animations
  const displayIndexValue = useDerivedValue(
    () => renderIndexToDisplayIndex.value[renderIndex] ?? renderIndex
  )
  const contentHeight = useSharedValue(0)
  // Translation based on cells reordering
  // (e.g when the item is swapped with the active item)
  const orderTranslateX = useSharedValue(0)
  const orderTranslateY = useSharedValue(0)
  // Reset order translation on re-render
  orderTranslateX.value = 0
  orderTranslateY.value = 0
  // Translation based on the user dragging the item
  // (we keep it separate to animate the dropped item to the target
  // position without flickering when items are re-rendered in
  // the new order and the drop animation has not finished yet)
  const dragTranslateX = useSharedValue(0)
  const dragTranslateY = useSharedValue(0)

  const zIndex = useAnimatedZIndex(renderIndex)
  useItemOrderUpdater(renderIndex, activeIndex, displayIndexValue, numColumns)

  const updateCellMeasurements = useCallback(() => {
    const onSuccess: MeasureLayoutOnSuccessCallback = (x, y, w, h) => {
      runOnUI(() => {
        const currentMeasurements = itemAtIndexMeasurementsValue.value
        currentMeasurements[renderIndex] = { x, y, width: w, height: h }
        itemAtIndexMeasurementsValue.value = [...currentMeasurements]
        contentHeight.value = h
      })()
    }

    const listContainerNode = gridContainerRef.current
    const listItemNode = viewRef.current

    if (listItemNode && listContainerNode) {
      listItemNode.measureLayout(listContainerNode, onSuccess)
    }
  }, [gridContainerRef, itemAtIndexMeasurementsValue, renderIndex, contentHeight])

  const getItemOrderTranslation = useWorkletCallback(() => {
    const itemAtIndexMeasurements = itemAtIndexMeasurementsValue.value
    const displayIndex = displayIndexValue.value
    const renderMeasurements = itemAtIndexMeasurements[renderIndex]
    const displayMeasurements = itemAtIndexMeasurements[displayIndex]

    if (!renderMeasurements || !displayMeasurements) {
      return { x: 0, y: 0 }
    }

    return {
      x: displayMeasurements.x - renderMeasurements.x,
      y: displayMeasurements.y - renderMeasurements.y,
    }
  }, [renderIndex])

  const handleDragEnd = useWorkletCallback(() => {
    dragActivationProgress.value = withTiming(0, { duration: TIME_TO_ACTIVATE_PAN })
    touchedIndex.value = null
    if (!isActiveValue.value) {
      return
    }
    // Reset the active item
    previousActiveIndex.value = renderIndex
    // Reset this before state is updated to disable animated reactions
    // earlier (the state is always updated with a delay)
    isActiveValue.value = false

    // Translate the previously active item to its target position
    const orderTranslation = getItemOrderTranslation()
    // Update the current order translation and modify the drag translation
    // at the same time (this prevents flickering when items are re-rendered)
    dragTranslateX.value = dragTranslateX.value - orderTranslation.x
    dragTranslateY.value = dragTranslateY.value + scrollOffsetDiff.value - orderTranslation.y
    orderTranslateX.value = orderTranslation.x
    orderTranslateY.value = orderTranslation.y
    // Animate the remaining translation
    dragTranslateX.value = withTiming(0)
    dragTranslateY.value = withTiming(0)

    // Reset the active item index
    runOnJS(setActiveIndex)(null)
  }, [renderIndex, getItemOrderTranslation])

  // Translates the currently active (dragged) item
  useAnimatedReaction(
    () => ({
      activeTranslation: activeTranslationValue.value,
      active: isActiveValue.value,
    }),
    ({ active, activeTranslation }) => {
      if (!active || touchedIndex.value === null) {
        return
      }
      dragTranslateX.value = activeTranslation.x
      dragTranslateY.value = activeTranslation.y
    }
  )

  // Translates the item when it's not active and is swapped with the active item
  useAnimatedReaction(
    () => ({
      displayIndex: displayIndexValue.value,
      itemAtIndexMeasurements: itemAtIndexMeasurementsValue.value,
      active: isActiveValue.value,
    }),
    ({ displayIndex, active, itemAtIndexMeasurements }) => {
      if (active) {
        return
      }

      const renderMeasurements = itemAtIndexMeasurements[renderIndex]
      const displayMeasurements = itemAtIndexMeasurements[displayIndex]
      if (!renderMeasurements || !displayMeasurements) {
        return
      }

      if (activeIndex !== null && touchedIndex.value !== null) {
        // If the order changes as a result of the user dragging an item,
        // translate the item to its new position with animation
        orderTranslateX.value = withTiming(displayMeasurements.x - renderMeasurements.x)
        orderTranslateY.value = withTiming(displayMeasurements.y - renderMeasurements.y)
      } else if (renderIndex !== previousActiveIndex.value) {
        // If the order changes as a result of the data change, reset
        // the item position without animation (it re-renders in the new position,
        // so the previously applied translation is no longer valid)
        orderTranslateX.value = 0
        orderTranslateY.value = 0
      }
    },
    [renderIndex, activeIndex]
  )

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(TIME_TO_ACTIVATE_PAN)
        .onTouchesDown(() => {
          touchedIndex.value = renderIndex
          previousActiveIndex.value = null
          dragActivationProgress.value = withTiming(1, { duration: TIME_TO_ACTIVATE_PAN })
        })
        .onStart(() => {
          if (touchedIndex.value !== renderIndex) {
            return
          }
          activeTranslationValue.value = { x: 0, y: 0 }
          dragActivationProgress.value = withTiming(1, { duration: TIME_TO_ACTIVATE_PAN })
          runOnJS(setActiveIndex)(renderIndex)
        })
        .onUpdate((e) => {
          if (!isActiveValue.value) {
            return
          }
          activeTranslationValue.value = { x: e.translationX, y: e.translationY }
        })
        .onTouchesCancelled(handleDragEnd)
        .onEnd(handleDragEnd)
        .onTouchesUp(handleDragEnd)
        .enabled(editable),
    [
      activeTranslationValue,
      dragActivationProgress,
      isActiveValue,
      handleDragEnd,
      previousActiveIndex,
      touchedIndex,
      renderIndex,
      setActiveIndex,
      editable,
    ]
  )

  const animatedCellStyle = useAnimatedStyle(() => ({
    zIndex: zIndex.value,
    height: contentHeight.value > 0 ? contentHeight.value : undefined,
  }))

  const animatedOrderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: orderTranslateX.value }, { translateY: orderTranslateY.value }],
  }))

  const animatedDragStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragTranslateX.value },
      { translateY: dragTranslateY.value + (isActiveValue.value ? scrollOffsetDiff.value : 0) },
    ],
  }))

  const content = useMemo(
    () =>
      renderItem({
        index: renderIndex,
        item,
        dragActivationProgress,
        isTouched,
      }),
    [renderIndex, dragActivationProgress, item, renderItem, isTouched]
  )

  const cellStyle = {
    width: `${100 / numColumns}%`,
  }

  return (
    // The outer view is used to resize the cell to the size of the new item
    // in case the new item height is different than the height of the previous one
    <Animated.View pointerEvents="box-none" style={[cellStyle, animatedCellStyle]}>
      <GestureDetector gesture={panGesture}>
        {/* The inner view will be translated during grid items reordering */}
        <Animated.View
          ref={viewRef}
          style={activeIndex !== null ? animatedOrderStyle : styles.noTranslation}>
          <Animated.View style={animatedDragStyle} onLayout={updateCellMeasurements}>
            <ActiveItemDecoration renderIndex={renderIndex}>{content}</ActiveItemDecoration>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  noTranslation: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
})

export default memo(SortableGridItem) as <I>(props: SortableGridItemProps<I>) => JSX.Element
