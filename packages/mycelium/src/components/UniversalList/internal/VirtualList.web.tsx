import { LegendList, type LegendListRef } from '@legendapp/list/react'
import { type CSSProperties, type ReactElement, useImperativeHandle, useMemo, useRef } from 'react'
import { ROW_VIEWABILITY_CONFIG } from '../consts'
import type { UniversalListPropsWithRef } from '../types'
import { createItemTypeResolver, createOverrideItemLayout } from './itemLayout'

// Web/extension implementation backed by Legend List's DOM-native build (no react-native-web).
// Native-only props (refreshing/onRefresh/refreshIndicatorColor,
// keyboardShouldPersistTaps, renderScrollComponent, onContentSizeChange, refScrollView) have no DOM
// counterpart and are intentionally not forwarded.
export function VirtualList<T>({
  contentContainerStyle,
  data,
  drawDistance,
  estimatedItemSize,
  estimatedListSize,
  extraData,
  getFixedItemSize,
  getItemSpan,
  getItemType,
  horizontal,
  itemsAreEqual,
  ItemSeparatorComponent,
  keyExtractor,
  ListEmptyComponent,
  ListFooterComponent,
  ListFooterComponentStyle,
  ListHeaderComponent,
  ListHeaderComponentStyle,
  maintainVisibleContentPosition,
  numColumns,
  onEndReached,
  onEndReachedThreshold,
  onScroll,
  recycleItems,
  ref,
  renderItem,
  scrollEnabled,
  scrollEventThrottle,
  showsHorizontalScrollIndicator,
  showsVerticalScrollIndicator,
  style,
  testID,
  trackRowViewability,
  useWindowScroll,
}: UniversalListPropsWithRef<T, CSSProperties>): ReactElement {
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

  const overrideItemLayout = useMemo(() => createOverrideItemLayout(getItemSpan), [getItemSpan])

  const resolveItemType = useMemo(() => createItemTypeResolver(getItemType), [getItemType])

  // scrollEnabled === false overrides the DOM build's inline `overflow: auto` (a class can't beat
  // it), merged on top of the consumer's style.
  const resolvedStyle = useMemo(
    () => (scrollEnabled === false ? { ...style?.style, ...SCROLL_DISABLED_STYLE } : style?.style),
    [scrollEnabled, style?.style],
  )

  return (
    <LegendList
      className={style?.className}
      contentContainerClassName={contentContainerStyle?.className}
      contentContainerStyle={contentContainerStyle?.style}
      data={data}
      data-testid={testID}
      drawDistance={drawDistance}
      estimatedItemSize={estimatedItemSize}
      estimatedListSize={estimatedListSize}
      extraData={extraData}
      getFixedItemSize={getFixedItemSize}
      getItemType={resolveItemType}
      horizontal={horizontal}
      itemsAreEqual={itemsAreEqual}
      ItemSeparatorComponent={ItemSeparatorComponent}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ListFooterComponentStyle={ListFooterComponentStyle?.style}
      ListHeaderComponent={ListHeaderComponent}
      ListHeaderComponentStyle={ListHeaderComponentStyle?.style}
      maintainVisibleContentPosition={maintainVisibleContentPosition}
      numColumns={numColumns}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onScroll={onScroll}
      overrideItemLayout={overrideItemLayout}
      recycleItems={recycleItems}
      scrollEventThrottle={scrollEventThrottle}
      ref={legendRef}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={resolvedStyle}
      useWindowScroll={useWindowScroll}
      viewabilityConfig={trackRowViewability ? ROW_VIEWABILITY_CONFIG : undefined}
    />
  )
}

const SCROLL_DISABLED_STYLE: CSSProperties = { overflowX: 'hidden', overflowY: 'hidden' }
