import { LegendList, type LegendListRef } from '@legendapp/list/react'
import { type ReactElement, useImperativeHandle, useMemo, useRef } from 'react'
import type { UniversalListPropsWithRef } from '../types'

// Web/extension implementation backed by Legend List's DOM-native build (no react-native-web).
// Native-only props (refreshing/onRefresh, keyboardShouldPersistTaps, renderScrollComponent) have no
// DOM counterpart and are intentionally not forwarded.
export function VirtualList<T>({
  contentContainerStyle,
  data,
  estimatedItemSize,
  getFixedItemSize,
  getItemType,
  horizontal,
  keyExtractor,
  ListEmptyComponent,
  ListFooterComponent,
  ListHeaderComponent,
  maintainVisibleContentPosition,
  numColumns,
  onEndReached,
  onEndReachedThreshold,
  recycleItems,
  ref,
  renderItem,
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

  return (
    <LegendList
      className={style?.className}
      contentContainerClassName={contentContainerStyle?.className}
      data={data}
      data-testid={testID}
      estimatedItemSize={estimatedItemSize}
      getFixedItemSize={getFixedItemSize}
      getItemType={resolveItemType}
      horizontal={horizontal}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      maintainVisibleContentPosition={maintainVisibleContentPosition}
      numColumns={numColumns}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      recycleItems={recycleItems}
      ref={legendRef}
      renderItem={renderItem}
    />
  )
}
