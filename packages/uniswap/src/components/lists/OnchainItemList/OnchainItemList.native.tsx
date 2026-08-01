import { FlashList, FlashListRef } from '@shopify/flash-list'
import { memo, useCallback, useEffect, useMemo, useRef, type PropsWithChildren } from 'react'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { AnimatedBottomSheetFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemListProps } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import {
  ProcessedRow,
  ProcessedRowType,
  processSectionsToRows,
} from 'uniswap/src/components/lists/OnchainItemList/processSectionsToRows'
import { getSectionHeaderRowKey, getSectionItemRowKey } from 'uniswap/src/components/lists/OnchainItemList/rowKeys'
import { EXPANDABLE_ASSET_ROW_HEIGHT_TRANSITION_MS } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

const TOKEN_ITEM_SIZE = 64
// Rows ahead of the viewport to pre-render. Kept small so the initial mount stays cheap;
// a large window mounts dozens of heavy rows synchronously when the list first appears.
const AMOUNT_TO_DRAW = 5

const EXPANDABLE_ROW_LAYOUT_TRANSITION = LinearTransition.duration(EXPANDABLE_ASSET_ROW_HEIGHT_TRANSITION_MS)
const AnimatedCellContainer = Animated.View

// Only multi-issuer (grouped ticker) rows are expandable / dynamic-height.
function isExpandableRow(row: ProcessedRow): boolean {
  return (
    row.type === ProcessedRowType.Item &&
    !Array.isArray(row.data.item) &&
    row.data.item.rowLayout?.dynamicHeight === true
  )
}

// Reanimated tweens the cell view between its collapsed and expanded layouts so an expanding/collapsing row grows
// smoothly and the rows below slide rather than snap. `overflow: hidden` clips the fully-rendered issuer panel to
// the animating height so it reveals progressively.
function AnimatedCellRenderer({
  style,
  ...props
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>
  onLayout?: (event: LayoutChangeEvent) => void
  index: number
}>): JSX.Element {
  return (
    <AnimatedCellContainer
      {...props}
      layout={EXPANDABLE_ROW_LAYOUT_TRANSITION}
      style={[style, { overflow: 'hidden' }]}
    />
  )
}

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
  const ref = useRef<FlashListRef<ProcessedRow>>(null)

  useEffect(() => {
    if (sectionListRef) {
      sectionListRef.current = {
        scrollToLocation: ({ itemIndex, sectionIndex, animated }): void => {
          void ref.current?.scrollToIndex({ index: itemIndex || sectionIndex, animated })
        },
      }
    }
  }, [sectionListRef])

  const data = useMemo(() => {
    return processSectionsToRows({ sections, expandedItems, keyExtractor })
  }, [sections, expandedItems, keyExtractor])

  // Only animate cell layout when the list contains expandable rows, so plain token/wallet lists keep their instant
  // layout and don't animate on every search keystroke.
  const hasExpandableRows = useMemo(() => data.some(isExpandableRow), [data])

  // TODO(WALL-5889): fix sticky header indices (prevent duplicates)
  // const stickyHeaderIndices: number[] = useMemo(() => {
  //   return data
  //     .map((row, index) => (row.type === ProcessedRowType.Header ? index : null))
  //     .filter((index) => index !== null) as number[]
  // }, [data])

  const renderFlashListItem = useCallback(
    ({ item }: { item: ProcessedRow }) => {
      switch (item.type) {
        case ProcessedRowType.Header:
          return renderSectionHeader?.(item.data) ?? null
        case ProcessedRowType.Item:
          return renderItem(item.data)
        default:
          return null
      }
    },
    [renderItem, renderSectionHeader],
  )

  const getItemType = useCallback((row: ProcessedRow): string => {
    // Typing fixed-height single-issuer rows as dynamic fragments the recycle pool and breaks RecyclerListView's
    // type-based height reuse for neighboring rows.
    return isExpandableRow(row) ? 'item-dynamic-height' : row.type
  }, [])

  const overrideItemLayout = useCallback((layout: { size?: number }, row: ProcessedRow): void => {
    if (row.type !== ProcessedRowType.Item || Array.isArray(row.data.item) || !row.data.item.rowLayout) {
      return
    }
    const { rowLayout } = row.data.item
    layout.size = row.data.expanded ? rowLayout.expandedHeightPx : rowLayout.collapsedHeightPx
  }, [])

  const makeKey = useCallback(
    // Section-scoped, position-independent keys (mirrors web). A `-${index}` suffix would re-key every row below
    // an added/removed Recents section, forcing a relayout that under-estimates content height (SWAP-2787).
    (item: ProcessedRow): string => {
      switch (item.type) {
        case ProcessedRowType.Header:
          return getSectionHeaderRowKey(item.data.section.sectionKey)
        case ProcessedRowType.Item:
          return getSectionItemRowKey({
            sectionKey: item.data.section.sectionKey,
            itemKey: keyExtractor?.(item.data.item, item.data.index),
            index: item.data.index,
          })
        default:
          return ''
      }
    },
    [keyExtractor],
  )
  const ListComponent = renderedInModal ? AnimatedBottomSheetFlashList : FlashList

  return (
    <ListComponent
      ref={ref}
      data={data}
      ListEmptyComponent={ListEmptyComponent}
      estimatedItemSize={TOKEN_ITEM_SIZE}
      contentContainerStyle={[{ paddingBottom: insets.bottom }, contentContainerStyle]}
      keyboardShouldPersistTaps="always"
      keyExtractor={makeKey}
      keyboardDismissMode="on-drag"
      renderItem={renderFlashListItem}
      getItemType={getItemType}
      overrideItemLayout={overrideItemLayout}
      CellRendererComponent={hasExpandableRows ? AnimatedCellRenderer : undefined}
      extraData={expandedItems}
      showsVerticalScrollIndicator={false}
      drawDistance={TOKEN_ITEM_SIZE * AMOUNT_TO_DRAW}
      // TODO(WALL-5889): fix sticky header indices (prevent duplicates)
      // stickyHeaderIndices={stickyHeaderIndices}
    />
  )
})
