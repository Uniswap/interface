import { memo, useRef } from 'react'
import { LayoutChangeEvent, MeasureLayoutOnSuccessCallback, View } from 'react-native'
import { Flex, FlexProps } from 'ui/src'
import SortableGridItem from './SortableGridItem'
import SortableGridProvider, { useSortableGridContext } from './SortableGridProvider'
import { useStableCallback } from './hooks'
import { AutoScrollProps, SortableGridChangeEvent, SortableGridRenderItem } from './types'
import { defaultKeyExtractor } from './utils'

type SortableGridProps<I> = Omit<SortableGridInnerProps<I>, 'keyExtractor'> &
  AutoScrollProps & {
    onChange: (e: SortableGridChangeEvent<I>) => void
    onDragStart?: () => void
    onDragEnd?: () => void
    keyExtractor?: (item: I, index: number) => string
    editable?: boolean
    activeItemScale?: number
    activeItemOpacity?: number
    activeItemShadowOpacity?: number
  }

function SortableGrid<I>({
  data,
  onDragStart,
  onDragEnd,
  keyExtractor: keyExtractorProp,
  activeItemScale,
  activeItemOpacity,
  activeItemShadowOpacity,
  onChange: onChangeProp,
  scrollableRef,
  scrollY,
  visibleHeight,
  editable,
  numColumns = 1,
  ...rest
}: SortableGridProps<I>): JSX.Element {
  const keyExtractor = useStableCallback(keyExtractorProp ?? defaultKeyExtractor)
  const onChange = useStableCallback(onChangeProp)

  const providerProps = {
    activeItemScale,
    activeItemOpacity,
    activeItemShadowOpacity,
    data,
    editable,
    onChange,
    scrollY,
    scrollableRef,
    visibleHeight,
    onDragStart,
    onDragEnd,
  }

  const gridProps = {
    data,
    keyExtractor,
    numColumns,
    scrollableRef,
    ...rest,
  }

  return (
    <SortableGridProvider {...providerProps}>
      <MemoSortableGridInner {...gridProps} />
    </SortableGridProvider>
  )
}

type SortableGridInnerProps<I> = FlexProps & {
  keyExtractor: (item: I, index: number) => string
  numColumns?: number
  data: I[]
  renderItem: SortableGridRenderItem<I>
  containerRef?: React.RefObject<View>
}

function SortableGridInner<I>({
  data,
  renderItem,
  numColumns = 1,
  keyExtractor,
  containerRef,
  ...flexProps
}: SortableGridInnerProps<I>): JSX.Element {
  const { gridContainerRef, containerStartOffset, containerEndOffset, touchedIndex } =
    useSortableGridContext()
  const internalDataRef = useRef(data)

  const measureContainer = useStableCallback((e: LayoutChangeEvent) => {
    // If there is no parent element, assume the grid is the first child
    // in the scrollable container
    if (!containerRef?.current) {
      containerEndOffset.value = e.nativeEvent.layout.height
      return
    }

    // Otherwise, measure its offset relative to the scrollable container
    const onSuccess: MeasureLayoutOnSuccessCallback = (x, y, w, h) => {
      containerStartOffset.value = y
      containerEndOffset.value = y + h
    }

    const parentNode = containerRef.current
    const gridNode = gridContainerRef.current

    if (gridNode) {
      gridNode.measureLayout(parentNode, onSuccess)
    }
  })

  // Update only if the user doesn't interact with the grid
  // (we don't want to reorder items based on the input data
  // while the user is dragging an item)
  if (touchedIndex.value === null) {
    internalDataRef.current = data
  }

  return (
    <Flex ref={gridContainerRef} row flexWrap="wrap" onLayout={measureContainer} {...flexProps}>
      {internalDataRef.current.map((item, index) => (
        <SortableGridItem
          key={keyExtractor(item, index)}
          index={index}
          item={item}
          numColumns={numColumns}
          renderItem={renderItem}
        />
      ))}
    </Flex>
  )
}

const MemoSortableGridInner = memo(SortableGridInner) as typeof SortableGridInner

export default SortableGrid
