import type { ComponentType, CSSProperties, ReactElement, ReactNode, Ref } from 'react'
import type { ColorValue, ScrollView, StyleProp, ViewStyle } from 'react-native'

export interface UniversalListRenderItemInfo<T> {
  item: T
  index: number
}

/**
 * Cross-platform scroll event. Both engines populate `nativeEvent.contentOffset` (native from the RN
 * scroll event, web from Legend List's normalized DOM event), so it's the portable way to read the
 * scroll position on either platform. Kept structural so it's assignable to both engines' `onScroll`
 * without a per-platform cast — the web build ships its own incompatible `NativeSyntheticEvent`.
 */
export interface UniversalListScrollEvent {
  nativeEvent: { contentOffset: { x: number; y: number } }
}

/**
 * Raw-style escape-hatch value: a React Native `ViewStyle` (native) or `CSSProperties` (web). The
 * platform engines pin `UniversalListStyle`'s type parameter to their own side, so each gets a
 * first-class, cast-free style; the default accepts either for cross-platform call sites.
 */
export type UniversalListStyleValue = StyleProp<ViewStyle> | CSSProperties

/** Tailwind-based style hooks for the list container and its content container. */
export interface UniversalListStyle<TStyle = UniversalListStyleValue> {
  className?: string
  /**
   * Raw-style escape hatch for values Tailwind can't express — e.g. inset-derived padding computed
   * at runtime. `ViewStyle` on native, `CSSProperties` on web. Prefer `className` where possible.
   */
  style?: TStyle
}

/** Item data and how to render + key it. */
interface ListDataProps<T> {
  /** Must be a stable reference — don't derive it inline (`data={items.filter(…)}`). */
  data: ReadonlyArray<T>
  renderItem: (info: UniversalListRenderItemInfo<T>) => ReactElement | null
  /**
   * Required. The keys it returns must be stable and position-independent — index-derived keys cause
   * relayout and recycling-state bugs (SWAP-2787). Dev builds log an error on duplicates.
   */
  keyExtractor: (item: T, index: number) => string
}

/** Sizing, recycling, and item arrangement. */
interface ListLayoutProps<T> {
  /** First-render hint only; the engine measures dynamically. */
  estimatedItemSize?: number
  /** First-render viewport hint (e.g. window dimensions) so the engine can size the initial window before layout. */
  estimatedListSize?: { width: number; height: number }
  /**
   * Exact height for an item, or undefined to fall back to the estimate for that item. It positions the row
   * before it mounts; a mounted row still measures and overwrites the value, so a number that doesn't match the
   * rendered height shows up as a jump when the row first appears rather than a permanent gap.
   */
  getFixedItemSize?: (item: T, index: number) => number | undefined
  /**
   * How many columns an item occupies in a multi-column list — e.g. return `numColumns` for a
   * full-width section row inside a grid. Return undefined to leave an item at the default single
   * column. Must be a stable reference.
   */
  getItemSpan?: (item: T, index: number) => number | undefined
  /** Recycle-pool bucketing for heterogeneous rows. Must be a stable reference. */
  getItemType?: (item: T, index: number) => string | number
  /**
   * State a row renders from that doesn't live in its `item`. The engine memoizes each cell on
   * `(key, item, extraData)` and calls `renderItem` again only when one of those changes — so a row
   * whose output depends on something external (an expanded flag, a selection) freezes at its first
   * render unless that value is passed here.
   *
   * Compared by identity, so a primitive or a memoized value is free when unchanged. Never pass a
   * fresh object/array literal: with `numColumns > 1` and `getItemSpan` set, a change also forces a
   * full item-position recalculation.
   */
  extraData?: unknown
  /**
   * Reuse row component instances while scrolling — a large perf win, but only safe for rows
   * without local state (state/refs/animations/uncontrolled inputs persist into the recycled item
   * unless reset). Defaults to off; enable for simple/stateless rows.
   */
  recycleItems?: boolean
  /**
   * Required for rows that call `useIsRowViewable`. Opt-in because Legend then recomputes
   * viewability on every scroll event.
   */
  trackRowViewability?: boolean
  /**
   * Custom equality for recycled items — return true to skip re-rendering an item whose data is
   * unchanged. Pairs with recycleItems for busy feeds. Must be a stable reference.
   */
  itemsAreEqual?: (prev: T, next: T) => boolean
  /** How far beyond the viewport (in px) to render ahead. Higher = smoother fast-scroll, more work per frame. */
  drawDistance?: number
  numColumns?: number
  horizontal?: boolean
}

/** Header / footer / empty slots (pass elements) plus the between-items separator (a component). */
interface ListSlotProps<T, TStyle> {
  ListHeaderComponent?: ReactElement | null
  ListFooterComponent?: ReactElement | null
  /** Rendered in place of the items when data is empty — still inside the scroll container, between header and footer. */
  ListEmptyComponent?: ReactElement | null
  /** Rendered between adjacent items — not before the first or after the last. Receives the item above it. */
  ItemSeparatorComponent?: ComponentType<{ leadingItem: T }>
  /**
   * Style for the header container (e.g. a zIndex to layer it above rows). Narrowed to the `style`
   * half deliberately: `contentContainerClassName` is the only className in Legend List's prop
   * surface, so neither engine can forward a header className and accepting one here would
   * typecheck while silently doing nothing.
   */
  ListHeaderComponentStyle?: Pick<UniversalListStyle<TStyle>, 'style'>
  /** Style for the footer container (e.g. a negative zIndex so it sits behind the last rows). */
  ListFooterComponentStyle?: Pick<UniversalListStyle<TStyle>, 'style'>
}

/** Infinite-scroll and prepend behavior. */
interface ListPaginationProps {
  onEndReached?: () => void
  onEndReachedThreshold?: number
  /** Anchors the viewport when items are prepended (e.g. an activity feed). */
  maintainVisibleContentPosition?: boolean
}

/** Pull-to-refresh (native). */
interface ListRefreshProps {
  refreshing?: boolean
  onRefresh?: () => void
  /** Native-only. Tint color for the pull-to-refresh spinner. */
  refreshIndicatorColor?: ColorValue
}

/** Styling and container behavior. */
interface ListPresentationProps<TStyle> {
  style?: UniversalListStyle<TStyle>
  contentContainerStyle?: UniversalListStyle<TStyle>
  /** Show the vertical scroll indicator. Defaults to the platform default (usually shown). */
  showsVerticalScrollIndicator?: boolean
  /**
   * Web-only. Scroll the document instead of an inner container. The DOM engine otherwise wraps the
   * list in its own `overflow: auto` element, which needs a height-bounded parent to virtualize
   * against — inside an unbounded one it grows to full content height, stops virtualizing, and
   * reserves a redundant scrollbar gutter beside the page's own. Set this where the surrounding page
   * is already the scroller. Ignored on native.
   */
  useWindowScroll?: boolean
  /** Show the horizontal scroll indicator. Defaults to the platform default (usually shown). */
  showsHorizontalScrollIndicator?: boolean
  /** Enable/disable scrolling. On web, `false` maps to `overflow: hidden` (the DOM build has no scrollEnabled). */
  scrollEnabled?: boolean
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled'
  /** Native-only. How dragging the list dismisses the keyboard. */
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive'
  /** Fires as the list scrolls; read `event.nativeEvent.contentOffset` for the scroll position. */
  onScroll?: (event: UniversalListScrollEvent) => void
  /**
   * Minimum ms between `onScroll` calls. Set 16 (~60fps) when `onScroll` drives an animation such as
   * a collapsing header. Note the defaults differ: native reports far less often when unset, while
   * the web engine leaves `onScroll` unthrottled — so setting it makes native smoother and web
   * cheaper.
   */
  scrollEventThrottle?: number
  /** Native-only. Fires when the scrollable content size changes — e.g. to drive an adaptive footer. */
  onContentSizeChange?: (width: number, height: number) => void
  /**
   * Native-only. Ref to the underlying ScrollView — e.g. a reanimated `useAnimatedRef` for
   * drag-to-sort or scroll-linked animations. Accepts an `AnimatedRef<ScrollView>`.
   */
  refScrollView?: Ref<ScrollView>
  /**
   * Native only. Scroll container the list renders within. Inject this when the list
   * lives inside a bottom sheet — e.g. `@gorhom/bottom-sheet`'s `BottomSheetScrollView` —
   * so scroll gestures route through the sheet. Kept as an injected dependency so Mycelium
   * does not depend on any bottom-sheet library. Must be a stable reference.
   *
   * The component is handed the list's scroll props (`onScroll`, `contentContainerStyle`,
   * `contentOffset`, …) *plus* `children` and a `ref`, and every one of them has to reach the
   * ScrollView it renders. A library component that already spreads its props — e.g.
   * `BottomSheetScrollView` — can be passed directly. Swallowing the ref leaves `scrollTo*` and
   * viewport anchoring silently doing nothing.
   */
  renderScrollComponent?: ComponentType<{ children: ReactNode }>
  testID?: string
}

export type UniversalListProps<T, TStyle = UniversalListStyleValue> = ListDataProps<T> &
  ListLayoutProps<T> &
  ListSlotProps<T, TStyle> &
  ListPaginationProps &
  ListRefreshProps &
  ListPresentationProps<TStyle>

export interface UniversalListRef {
  scrollToIndex: (params: { index: number; animated?: boolean }) => void
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void
  scrollToEnd: (params?: { animated?: boolean }) => void
  scrollToTop: (params?: { animated?: boolean }) => void
}

/** Props plus the forwarded imperative ref (React 19 ref-as-prop). Internal to the platform split. */
export type UniversalListPropsWithRef<T, TStyle = UniversalListStyleValue> = UniversalListProps<T, TStyle> & {
  ref?: Ref<UniversalListRef>
}
