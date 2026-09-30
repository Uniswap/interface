import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { UniversalList, type UniversalListRef, type UniversalListRenderItemInfo } from '@universe/mycelium'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import {
  getNativeRowFixedSize,
  getNativeRowItemType,
} from 'uniswap/src/components/lists/OnchainItemList/nativeRowLayout'
import { OnchainItemListProps } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import {
  getProcessedRowKey,
  ProcessedRow,
  ProcessedRowType,
  processSectionsToRows,
  toFlatRowIndex,
} from 'uniswap/src/components/lists/OnchainItemList/processSectionsToRows'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

const TOKEN_ITEM_SIZE = 64
// Rows to keep rendered beyond the viewport. Legend List caps the first paint at the visible rows
// regardless and fills the rest of this window a frame later, so a larger window costs nothing at
// open and gives a normal-speed scroll rows that are already there.
const AMOUNT_TO_DRAW = 10

export const OnchainItemList = memo(function OnchainItemListInner({
  sectionListRef,
  ListEmptyComponent,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  sections,
  expandedItems,
  renderedInModal,
  contentContainerStyle,
}: OnchainItemListProps<OnchainItemListOption>): JSX.Element {
  const insets = useAppInsets()
  const ref = useRef<UniversalListRef>(null)

  useEffect(() => {
    if (sectionListRef) {
      sectionListRef.current = {
        // Callers address rows the SectionList way (section-relative, itemIndex counting the header),
        // but the row array is flat with a header ahead of each section's items, so both halves fold
        // into one index.
        scrollToLocation: ({ sectionIndex, itemIndex, animated }): void => {
          ref.current?.scrollToIndex({ index: toFlatRowIndex({ sections, sectionIndex, itemIndex }), animated })
        },
      }
    }
  }, [sectionListRef, sections])

  // Rows keep their identity across rebuilds (see `processSectionsToRows`), so a refetch that
  // rebuilds `sections` re-renders only the rows that actually changed.
  const previousRows = useRef<ProcessedRow[]>([])
  const data = useMemo(() => {
    const rows = processSectionsToRows({ sections, expandedItems, keyExtractor, previousRows: previousRows.current })
    previousRows.current = rows
    return rows
  }, [sections, expandedItems, keyExtractor])

  // TODO(WALL-5889): fix sticky header indices (prevent duplicates)
  // const stickyHeaderIndices: number[] = useMemo(() => {
  //   return data
  //     .map((row, index) => (row.type === ProcessedRowType.Header ? index : null))
  //     .filter((index) => index !== null) as number[]
  // }, [data])

  const renderRow = useCallback(
    ({ item }: UniversalListRenderItemInfo<ProcessedRow>): JSX.Element | null => {
      switch (item.type) {
        case ProcessedRowType.Header:
          return renderSectionHeader?.(item.data) ?? null
        case ProcessedRowType.Item:
          return renderItem(item.data)
        case ProcessedRowType.Footer:
          return item.data.footerElement
        default:
          return null
      }
    },
    [renderItem, renderSectionHeader],
  )

  const makeKey = useCallback(
    // Section-scoped, position-independent keys (mirrors web). A `-${index}` suffix would re-key every row below
    // an added/removed Recents section, forcing a relayout that under-estimates content height (SWAP-2787).
    (item: ProcessedRow): string => getProcessedRowKey(item, keyExtractor),
    [keyExtractor],
  )

  const listContentContainerStyle = useMemo(
    () => ({ style: [{ paddingBottom: insets.bottom }, contentContainerStyle] }),
    [insets.bottom, contentContainerStyle],
  )

  return (
    <UniversalList
      ref={ref}
      // Reassigning a cell re-renders the mounted row instead of tearing down and recreating ~25 native
      // views. Row-local state is safe to carry over: the only stateful bits are open-overlay flags
      // (warning modal, context menu), and an open overlay blocks the scroll that would recycle the row.
      recycleItems
      contentContainerStyle={listContentContainerStyle}
      data={data}
      drawDistance={TOKEN_ITEM_SIZE * AMOUNT_TO_DRAW}
      estimatedItemSize={TOKEN_ITEM_SIZE}
      getFixedItemSize={getNativeRowFixedSize}
      getItemType={getNativeRowItemType}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      keyExtractor={makeKey}
      ListEmptyComponent={ListEmptyComponent}
      renderItem={renderRow}
      // Route scroll gestures through the sheet's own scrollable when rendered inside one.
      renderScrollComponent={renderedInModal ? BottomSheetScrollView : undefined}
      showsVerticalScrollIndicator={false}
      // TODO(WALL-5889): fix sticky header indices (prevent duplicates)
      // stickyHeaderIndices={stickyHeaderIndices}
    />
  )
})
