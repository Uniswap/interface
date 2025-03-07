import { LayoutChangeEvent, MeasureLayoutOnSuccessCallback, StyleSheet } from 'react-native'
import Animated, { LayoutAnimationConfig, useAnimatedStyle } from 'react-native-reanimated'
import { useAutoScrollContext } from 'src/components/sortableGrid/contexts/AutoScrollContextProvider'
import { useLayoutContext } from 'src/components/sortableGrid/contexts/LayoutContextProvider'
import { SortableGridProvider } from 'src/components/sortableGrid/internal/SortableGirdProvider'
import SortableGridItem from 'src/components/sortableGrid/internal/SortableGridItem'
import { useItemOrderUpdater } from 'src/components/sortableGrid/internal/hooks'
import { defaultKeyExtractor, useStableCallback } from 'src/components/sortableGrid/internal/utils'
import {
  ActiveItemDecorationSettings,
  AutoScrollProps,
  SortableGridChangeEvent,
  SortableGridDragStartEvent,
  SortableGridDropEvent,
  SortableGridRenderItem,
} from 'src/components/sortableGrid/types'

type SortableGridProps<I> = AutoScrollProps &
  Partial<ActiveItemDecorationSettings> & {
    data: I[]
    renderItem: SortableGridRenderItem<I>
    numColumns?: number
    editable?: boolean
    animateContainerHeight?: boolean
    keyExtractor?: (item: I, index: number) => string
    onChange?: (e: SortableGridChangeEvent<I>) => void
    onDragStart?: (e: SortableGridDragStartEvent<I>) => void
    onDrop?: (e: SortableGridDropEvent<I>) => void
  }

export function SortableGrid<I>({
  data,
  renderItem,
  numColumns = 1,
  keyExtractor = defaultKeyExtractor,
  containerRef,
  ...rest
}: SortableGridProps<I>): JSX.Element {
  const stableKeyExtractor = useStableCallback(keyExtractor)

  const sharedProps = {
    data,
    numColumns,
    keyExtractor: stableKeyExtractor,
  }

  return (
    <SortableGridProvider {...sharedProps} {...rest}>
      <SortableGridInner {...sharedProps} containerRef={containerRef} renderItem={renderItem} />
    </SortableGridProvider>
  )
}

type SortableGridInnerProps<I> = Pick<
  SortableGridProps<I>,
  'data' | 'renderItem' | 'numColumns' | 'keyExtractor' | 'containerRef'
>

function SortableGridInner<I>({
  data,
  renderItem,
  containerRef,
  numColumns = 1,
  keyExtractor = defaultKeyExtractor,
}: SortableGridInnerProps<I>): JSX.Element {
  const { containerHeight, containerWidth, appliedContainerHeight } = useLayoutContext()
  const { gridContainerRef, containerStartOffset } = useAutoScrollContext()

  useItemOrderUpdater(numColumns)

  const handleGridMeasurement = ({
    nativeEvent: {
      layout: { height, width },
    },
  }: LayoutChangeEvent): void => {
    if (containerHeight.value !== -1) {
      return
    }
    // Measure container using onLayout only once, on the initial render
    // (container dimensions will be updated from the context provider
    // when data changes, so we don't want to re-measure the container)
    if (containerHeight.value === -1) {
      containerHeight.value = height
      containerWidth.value = width
    }

    // Measure offset relative to the specifiec container (if containerRef
    // is provided, otherwise assume that the grid component is the first
    // child of the the parent container)
    const onSuccess: MeasureLayoutOnSuccessCallback = (_, y) => {
      containerStartOffset.value = y
    }

    const parentNode = containerRef?.current
    const gridNode = gridContainerRef.current

    if (parentNode && gridNode) {
      gridNode.measureLayout(parentNode, onSuccess)
    }
  }

  const handleHelperMeasurement = ({
    nativeEvent: {
      layout: { height },
    },
  }: LayoutChangeEvent): void => {
    if (appliedContainerHeight.value === -1 && height === 0) {
      return
    }
    appliedContainerHeight.value = height
  }

  const animatedContainerStyle = useAnimatedStyle(() => ({
    width: containerWidth.value === -1 ? 'auto' : containerWidth.value,
    height: containerHeight.value === -1 ? 'auto' : containerHeight.value,
  }))

  return (
    <LayoutAnimationConfig skipExiting>
      <Animated.View
        ref={gridContainerRef}
        style={[styles.gridContainer, animatedContainerStyle]}
        onLayout={handleGridMeasurement}
      >
        {data.map((item, index) => {
          const key = keyExtractor(item, index)
          return (
            <SortableGridItem key={key} item={item} itemKey={key} numColumns={numColumns} renderItem={renderItem} />
          )
        })}
      </Animated.View>

      {/* This dummy Animated.View is used only to determine if the containerHeight
      from the animated style was applied. We can't use onLayout on the grid items wrapper component because it already has the same height as containerHeight
      value, thus the onLayout callback won't be called again, because the size
      of the component doesn't change. */}
      <Animated.View style={[styles.helperView, animatedContainerStyle]} onLayout={handleHelperMeasurement} />
    </LayoutAnimationConfig>
  )
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  helperView: {
    opacity: 0,
    pointerEvents: 'none',
    position: 'absolute',
  },
})
