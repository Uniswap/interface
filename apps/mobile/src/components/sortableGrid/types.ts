import { FlatList, ScrollView, View } from 'react-native'
import { SharedValue } from 'react-native-reanimated'

export type Require<T, K extends keyof T = keyof T> = Required<Pick<T, K>> & Omit<T, K>

export type ItemMeasurements = {
  height: number
  width: number
  x: number
  y: number
}

export type AutoScrollProps = {
  scrollableRef: React.RefObject<FlatList | ScrollView>
  visibleHeight: SharedValue<number>
  scrollY: SharedValue<number>
  // The parent container inside the scrollable that wraps the grid
  // (e.g. when the grid is rendered inside the FlatList header)
  // if not provided, we assume that the grid is the first child in
  // the scrollable container
  containerRef?: React.RefObject<View>
}

export type SortableGridContextType = {
  gridContainerRef: React.RefObject<View>
  itemAtIndexMeasurements: SharedValue<ItemMeasurements[]>
  dragActivationProgress: SharedValue<number>
  activeIndex: number | null
  previousActiveIndex: SharedValue<number | null>
  activeTranslation: SharedValue<{ x: number; y: number }>
  scrollOffsetDiff: SharedValue<number>
  renderIndexToDisplayIndex: SharedValue<number[]>
  setActiveIndex: (index: number | null) => void
  onDragStart?: () => void
  displayToRenderIndex: SharedValue<number[]>
  activeItemScale: SharedValue<number>
  visibleHeight: SharedValue<number>
  activeItemOpacity: SharedValue<number>
  activeItemShadowOpacity: SharedValue<number>
  touchedIndex: SharedValue<number | null>
  editable: boolean
  containerStartOffset: SharedValue<number>
  containerEndOffset: SharedValue<number>
}

export type SortableGridRenderItemInfo<I> = {
  item: I
  index: number
  dragActivationProgress: SharedValue<number>
  isTouched: SharedValue<boolean>
}

export type SortableGridRenderItem<I> = (info: SortableGridRenderItemInfo<I>) => JSX.Element

export type Vector = {
  x: number
  y: number
}

export type SortableGridChangeEvent<I> = {
  data: I[]
  fromIndex: number
  toIndex: number
}
