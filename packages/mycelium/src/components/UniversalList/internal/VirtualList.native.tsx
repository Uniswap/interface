import { LegendList, type LegendListRef } from '@legendapp/list/react-native'
import { type ComponentType, type ReactElement, type Ref, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import {
  Animated,
  RefreshControl,
  type ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { ROW_VIEWABILITY_CONFIG } from '../consts'
import type { UniversalListPropsWithRef } from '../types'
import { coalesceScrollEvents } from './coalesceScrollEvents'
import { createItemTypeResolver, createOverrideItemLayout } from './itemLayout'

// Native implementation backed by Legend List. `useWindowScroll` is web-only (there is no document
// to scroll) and is intentionally not forwarded.
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
  keyboardDismissMode,
  keyboardShouldPersistTaps,
  keyExtractor,
  ListEmptyComponent,
  ListFooterComponent,
  ListFooterComponentStyle,
  ListHeaderComponent,
  ListHeaderComponentStyle,
  maintainVisibleContentPosition,
  numColumns,
  onContentSizeChange,
  onEndReached,
  onEndReachedThreshold,
  onRefresh,
  onScroll,
  recycleItems,
  ref,
  refreshIndicatorColor,
  refreshing,
  refScrollView,
  renderItem,
  renderScrollComponent: ScrollComponent,
  scrollEnabled,
  scrollEventThrottle,
  showsHorizontalScrollIndicator,
  showsVerticalScrollIndicator,
  style,
  testID,
  trackRowViewability,
}: UniversalListPropsWithRef<T, StyleProp<ViewStyle>>): ReactElement {
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

  // Always our own scroll container so every native list gets scroll-event coalescing (see
  // `CoalescedScrollView`). Hosts the consumer-injected container (e.g. BottomSheetScrollView) when
  // there is one, else the Animated.ScrollView Legend List would have rendered itself. The spread
  // carries the scroll props *and* the scroll-view ref, both of which reach the ScrollView.
  const renderScrollComponent = useMemo(
    () =>
      ({ children, ...scrollProps }: CoalescedScrollViewProps) => (
        <CoalescedScrollView Host={(ScrollComponent ?? Animated.ScrollView) as ScrollHost} {...scrollProps}>
          {children}
        </CoalescedScrollView>
      ),
    [ScrollComponent],
  )

  // Build the pull-to-refresh control here so its tint is themeable via a plain color prop and the
  // consumer never has to import RefreshControl.
  const refreshControl = useMemo(
    () =>
      onRefresh ? (
        <RefreshControl refreshing={refreshing ?? false} tintColor={refreshIndicatorColor} onRefresh={onRefresh} />
      ) : undefined,
    [onRefresh, refreshing, refreshIndicatorColor],
  )

  return (
    <LegendList
      className={style?.className}
      contentContainerClassName={contentContainerStyle?.className}
      contentContainerStyle={contentContainerStyle?.style}
      data={data}
      drawDistance={drawDistance}
      estimatedItemSize={estimatedItemSize}
      estimatedListSize={estimatedListSize}
      extraData={extraData}
      getFixedItemSize={getFixedItemSize}
      getItemType={resolveItemType}
      horizontal={horizontal}
      itemsAreEqual={itemsAreEqual}
      ItemSeparatorComponent={ItemSeparatorComponent}
      keyboardDismissMode={keyboardDismissMode}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ListFooterComponentStyle={ListFooterComponentStyle?.style}
      ListHeaderComponent={ListHeaderComponent}
      ListHeaderComponentStyle={ListHeaderComponentStyle?.style}
      maintainVisibleContentPosition={maintainVisibleContentPosition}
      numColumns={numColumns}
      onContentSizeChange={onContentSizeChange}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onScroll={onScroll}
      overrideItemLayout={overrideItemLayout}
      recycleItems={recycleItems}
      ref={legendRef}
      refreshControl={refreshControl}
      refreshing={refreshing}
      refScrollView={refScrollView}
      renderItem={renderItem}
      renderScrollComponent={renderScrollComponent}
      scrollEnabled={scrollEnabled}
      scrollEventThrottle={scrollEventThrottle}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={style?.style}
      testID={testID}
      viewabilityConfig={trackRowViewability ? ROW_VIEWABILITY_CONFIG : undefined}
    />
  )
}

// Both hosts take the ScrollView props Legend List spreads onto them; the injected component's prop
// type is only declared as `{ children }` so consumers aren't forced to retype the whole surface.
type ScrollHost = ComponentType<ScrollViewProps & { ref?: Ref<ScrollView> }>

type CoalescedScrollViewProps = ScrollViewProps & {
  ref?: Ref<ScrollView>
  /** Legend List sets this key on its scroll container (defined only when snapping); it is not for the host. */
  ScrollComponent?: unknown
}

/**
 * Feeds Legend List only the newest scroll event per frame — see `coalesceScrollEvents` for why. Every
 * other scroll prop, the ref included, passes straight through to the host ScrollView.
 */
function CoalescedScrollView({
  Host,
  onScroll,
  ScrollComponent: _unused,
  children,
  ...rest
}: CoalescedScrollViewProps & { Host: ScrollHost }): ReactElement {
  const onScrollRef = useRef(onScroll)
  onScrollRef.current = onScroll

  // Only a plain handler is coalesced. Legend List's sticky-header path passes an `Animated.event`,
  // which has to reach the ScrollView untouched for the native driver to attach to it.
  const coalescible = typeof onScroll === 'function'
  const coalesced = useMemo(
    () => (coalescible ? coalesceScrollEvents<ScrollEvent>((event) => onScrollRef.current?.(event)) : undefined),
    [coalescible],
  )
  useEffect(() => coalesced?.dispose, [coalesced])

  const onHostScroll = useMemo(
    () => (coalesced ? (event: ScrollEvent): void => coalesced.onScroll(retainScrollEvent(event)) : onScroll),
    [coalesced, onScroll],
  )

  return (
    <Host {...rest} onScroll={onHostScroll}>
      {children}
    </Host>
  )
}

type ScrollEvent = Parameters<NonNullable<ScrollViewProps['onScroll']>>[0]

/**
 * The flush runs a frame after the handler returned, and React Native recycles synthetic events
 * as soon as the handler returns (nulling `nativeEvent`). Keep the event alive across that gap.
 */
function retainScrollEvent(event: ScrollEvent): ScrollEvent {
  if (typeof event.persist === 'function') {
    event.persist()
    return event
  }
  return { ...event, nativeEvent: event.nativeEvent }
}
