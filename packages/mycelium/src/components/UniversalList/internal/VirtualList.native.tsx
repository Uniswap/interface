import { LegendList, type LegendListRef } from '@legendapp/list/react-native'
import { type ReactElement, useImperativeHandle, useMemo, useRef } from 'react'
import type { ScrollViewProps } from 'react-native'
import type { UniversalListPropsWithRef } from '../types'

// Native implementation backed by Legend List.
export function VirtualList<T>({
  contentContainerStyle,
  data,
  estimatedItemSize,
  getFixedItemSize,
  getItemType,
  horizontal,
  keyboardShouldPersistTaps,
  keyExtractor,
  ListEmptyComponent,
  ListFooterComponent,
  ListHeaderComponent,
  maintainVisibleContentPosition,
  numColumns,
  onEndReached,
  onEndReachedThreshold,
  onRefresh,
  recycleItems,
  ref,
  refreshing,
  renderItem,
  renderScrollComponent: ScrollComponent,
  style,
  testID,
}: UniversalListPropsWithRef<T>): ReactElement {
  const legendRef = useRef<LegendListRef>(null)

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (params) => legendRef.current?.scrollToIndex(params),
      scrollToOffset: (params) => legendRef.current?.scrollToOffset(params),
      scrollToEnd: (params) => legendRef.current?.scrollToEnd(params),
      scrollToTop: (params) => legendRef.current?.scrollToOffset({ offset: 0, animated: params?.animated }),
    }),
    [],
  )

  const resolveItemType = useMemo(
    () => (getItemType ? (item: T, index: number) => String(getItemType(item, index)) : undefined),
    [getItemType],
  )

  // Consumer-injected scroll container (e.g. BottomSheetScrollView) for bottom sheets. The spread
  // carries the scroll props *and* the scroll-view ref, both of which the injected component has to
  // forward to the ScrollView it renders.
  const renderScrollComponent = useMemo(
    () => (ScrollComponent ? (scrollProps: ScrollViewProps) => <ScrollComponent {...scrollProps} /> : undefined),
    [ScrollComponent],
  )

  return (
    <LegendList
      className={style?.className}
      contentContainerClassName={contentContainerStyle?.className}
      data={data}
      estimatedItemSize={estimatedItemSize}
      getFixedItemSize={getFixedItemSize}
      getItemType={resolveItemType}
      horizontal={horizontal}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      maintainVisibleContentPosition={maintainVisibleContentPosition}
      numColumns={numColumns}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onRefresh={onRefresh}
      recycleItems={recycleItems}
      ref={legendRef}
      refreshing={refreshing}
      renderItem={renderItem}
      renderScrollComponent={renderScrollComponent}
      testID={testID}
    />
  )
}
