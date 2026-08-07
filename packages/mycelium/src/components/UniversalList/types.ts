import type { ComponentType, ReactElement, ReactNode, Ref } from 'react'

export interface UniversalListRenderItemInfo<T> {
  item: T
  index: number
}

/** Tailwind-based style hooks for the list container and its content container. */
export interface UniversalListStyle {
  className?: string
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
  /**
   * Exact fixed height for every item. Provide only when rows are truly a fixed size — it lets the
   * engine skip per-row measurement. A returned size that doesn't match the rendered height causes
   * layout gaps/overlaps.
   */
  getFixedItemSize?: (item: T, index: number) => number
  /** Recycle-pool bucketing for heterogeneous rows. Must be a stable reference. */
  getItemType?: (item: T, index: number) => string | number
  /**
   * Reuse row component instances while scrolling — a large perf win, but only safe for rows
   * without local state (state/refs/animations/uncontrolled inputs persist into the recycled item
   * unless reset). Defaults to off; enable for simple/stateless rows.
   */
  recycleItems?: boolean
  numColumns?: number
  horizontal?: boolean
}

/** Header / footer / empty slots (pass elements). */
interface ListSlotProps {
  ListHeaderComponent?: ReactElement | null
  ListFooterComponent?: ReactElement | null
  /** Rendered in place of the items when data is empty — still inside the scroll container, between header and footer. */
  ListEmptyComponent?: ReactElement | null
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
}

/** Styling and container behavior. */
interface ListPresentationProps {
  style?: UniversalListStyle
  contentContainerStyle?: UniversalListStyle
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled'
  /**
   * Native only. Scroll container the list renders within. Inject this when the list
   * lives inside a bottom sheet — e.g. `@gorhom/bottom-sheet`'s `BottomSheetScrollView` —
   * so scroll gestures route through the sheet. Kept as an injected dependency so Mycelium
   * does not depend on any bottom-sheet library. Must be a stable reference.
   *
   * The component is handed the list's scroll props (`onScroll`, `contentContainerStyle`,
   * `contentOffset`, …) *plus* a `ref`, and every one of them has to reach the ScrollView it
   * renders — i.e. spread the props through: `(props) => <BottomSheetScrollView {...props} />`.
   * Swallowing the ref leaves `scrollTo*` and viewport anchoring silently doing nothing.
   */
  renderScrollComponent?: ComponentType<{ children?: ReactNode }>
  testID?: string
}

export type UniversalListProps<T> = ListDataProps<T> &
  ListLayoutProps<T> &
  ListSlotProps &
  ListPaginationProps &
  ListRefreshProps &
  ListPresentationProps

export interface UniversalListRef {
  scrollToIndex: (params: { index: number; animated?: boolean }) => void
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void
  scrollToEnd: (params?: { animated?: boolean }) => void
  scrollToTop: (params?: { animated?: boolean }) => void
}

/** Props plus the forwarded imperative ref (React 19 ref-as-prop). Internal to the platform split. */
export type UniversalListPropsWithRef<T> = UniversalListProps<T> & {
  ref?: Ref<UniversalListRef>
}
