import { Flex, UniversalList, type UniversalListRef, type UniversalListRenderItemInfo } from '@universe/mycelium'
import isArray from 'lodash/isArray'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FocusedRowStoreContext } from 'uniswap/src/components/lists/focusedRowStore'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemListProps } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { toFlatRowIndex } from 'uniswap/src/components/lists/OnchainItemList/processSectionsToRows'
import {
  findFocusableRowIndex,
  getFirstFocusableRowIndex,
  hasWebHeaderRow,
  isDynamicHeightRowInfo,
  isHorizontalTokenRowInfo,
  isSectionFooter,
  isSectionHeader,
  type ListSectionRowInfo,
  type OnchainItemListData,
  toWebListRows,
} from 'uniswap/src/components/lists/OnchainItemList/rowInfo'
import { getRowsStructuralSignature } from 'uniswap/src/components/lists/OnchainItemList/rowKeys'
import { ITEM_SECTION_HEADER_ROW_HEIGHT } from 'uniswap/src/components/TokenSelector/constants'
import { KeyAction } from 'utilities/src/device/keyboard/types'
import { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown'

const ITEM_ROW_HEIGHT = 64

function getSectionHeaderHeight<T extends OnchainItemListOption>(rowInfo: ListSectionRowInfo<T>): number {
  return rowInfo.section.sectionHeaderHeight ?? ITEM_SECTION_HEADER_ROW_HEIGHT
}

/** Height of the header that pins over the viewport top once row `index` is scrolled there: its own section's. */
function getPinnedHeaderHeight<T extends OnchainItemListOption>(
  items: OnchainItemListData<T>[],
  index: number,
): number {
  for (let i = index - 1; i >= 0; i--) {
    const row = items[i]
    if (row && isSectionHeader(row)) {
      return getSectionHeaderHeight(row)
    }
  }
  return 0
}

/**
 * Height to pin the row's container to, or undefined to let it size to its content. Also handed to the
 * engine as `getFixedItemSize`, so fixed rows are positioned exactly before their first measurement
 * and skip the per-commit size bookkeeping; a pill section that resolved to nothing collapses to 0px.
 */
function getFixedRowHeight<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): number | undefined {
  if (isSectionHeader(rowInfo)) {
    return getSectionHeaderHeight(rowInfo)
  }
  // Footers are arbitrary elements (the search "View all" button), so they are measured.
  if (isSectionFooter(rowInfo)) {
    return undefined
  }
  if (isHorizontalTokenRowInfo(rowInfo)) {
    // A section that resolved to no pills collapses away rather than reserving a row.
    return isArray(rowInfo.item) && !rowInfo.item.length ? 0 : undefined
  }
  return isDynamicHeightRowInfo(rowInfo) ? undefined : ITEM_ROW_HEIGHT
}

function rowKey<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): string {
  return rowInfo.measurementKey
}

function rowType<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): string {
  if (isSectionHeader(rowInfo)) {
    return 'header'
  }
  if (isSectionFooter(rowInfo)) {
    return 'footer'
  }
  // Measured and fixed rows recycle separately: sharing a pool would hand a measured row's height to
  // a fixed neighbour before it re-measures.
  return isDynamicHeightRowInfo(rowInfo) ? 'item-dynamic-height' : 'item'
}

function renderRowContent<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): JSX.Element | null {
  if (isSectionHeader(rowInfo)) {
    return rowInfo.renderSectionHeader?.(rowInfo) ?? null
  }
  if (isSectionFooter(rowInfo)) {
    return rowInfo.footerElement
  }
  return rowInfo.renderItem(rowInfo)
}

export function OnchainItemList<T extends OnchainItemListOption>({
  ListEmptyComponent,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  sections,
  sectionListRef,
  expandedItems,
  focusedRowStore,
  autoFocusFirstRowKey,
  contentContainerStyle,
}: OnchainItemListProps<T>): JSX.Element {
  const listRef = useRef<UniversalListRef>(null)
  const listContentContainerStyle = useMemo(
    () => (contentContainerStyle ? { style: contentContainerStyle } : undefined),
    [contentContainerStyle],
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sectionListRef) {
      sectionListRef.current = {
        scrollToLocation: ({ itemIndex, sectionIndex, animated }): void => {
          listRef.current?.scrollToIndex({
            index: toFlatRowIndex({ sections, sectionIndex, itemIndex, hasHeaderRow: hasWebHeaderRow }),
            animated,
          })
        },
      }
    }
  }, [sectionListRef, sections])

  const items = useMemo(
    () => toWebListRows({ sections, renderSectionHeader, renderItem, keyExtractor, expandedItems }),
    [sections, renderSectionHeader, keyExtractor, renderItem, expandedItems],
  )

  // Latest-value ref, so the memo and effect below can read rows without taking `items` as a
  // dependency: `items` is a fresh array on nearly every render.
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Signature of the row SET (ordered keys): changes on insert/remove/reorder, not on every render.
  const structuralSignature = useMemo(
    () => getRowsStructuralSignature(items.map((item) => item.measurementKey)),
    [items],
  )

  // Keyed off the signature, not `items`: header positions only move when the row set does, and the
  // prop is contracted to be a stable reference.
  const stickyHeaderIndices = useMemo(() => {
    const indices: number[] = []
    itemsRef.current.forEach((item, index) => {
      if (isSectionHeader(item)) {
        indices.push(index)
      }
    })
    return indices
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- read through the ref; see above
  }, [structuralSignature])

  // Once per key: retries on row-set changes until a focusable row lands, then stops so late sections don't yank focus.
  const focusRow = focusedRowStore?.setFocusedRowIndex
  const [autoFocusedKey, setAutoFocusedKey] = useState<string | undefined>()
  useLayoutEffect(() => {
    if (autoFocusFirstRowKey === undefined || autoFocusFirstRowKey === autoFocusedKey || !focusRow) {
      return
    }
    const firstFocusableIndex = getFirstFocusableRowIndex(itemsRef.current)
    if (firstFocusableIndex === undefined) {
      return
    }
    setAutoFocusedKey(autoFocusFirstRowKey)
    focusRow(firstFocusableIndex)
  }, [autoFocusFirstRowKey, autoFocusedKey, focusRow, structuralSignature])

  const renderRow = useCallback(
    ({ item }: UniversalListRenderItemInfo<OnchainItemListData<T>>): JSX.Element => (
      <OnchainItemListRow rowInfo={item} />
    ),
    [],
  )

  const focusRowWithKeyboard = useCallback(
    (index: number): void => {
      focusedRowStore?.setFocusedRowIndex(index)
      // Not `scrollToIndex`, which scrolls unconditionally and would jump the list on every arrow key. The
      // offset keeps the row clear of its section header, which pins over the top once the row is scrolled there.
      listRef.current?.scrollIndexIntoView({ index, viewOffset: getPinnedHeaderHeight(itemsRef.current, index) })
    },
    [focusedRowStore],
  )

  const handleArrowKeyListScrolling = useCallback(
    (event: KeyboardEvent) => {
      if (!focusedRowStore) {
        return
      }
      const focusedRowIndex = focusedRowStore.getFocusedRowIndex()

      if (containerRef.current) {
        containerRef.current.tabIndex = 0
      }

      event.preventDefault()

      const firstItemRowIndex = getFirstFocusableRowIndex(items)
      if (firstItemRowIndex === undefined) {
        return
      }
      if (focusedRowIndex === undefined) {
        focusRowWithKeyboard(firstItemRowIndex)
        return
      }

      const direction = event.key === 'ArrowDown' ? 1 : -1
      const nextFocusedIndex = findFocusableRowIndex({ items, from: focusedRowIndex + direction, direction })
      if (nextFocusedIndex !== undefined) {
        focusRowWithKeyboard(nextFocusedIndex)
      }
    },
    [focusedRowStore, focusRowWithKeyboard, items],
  )

  useKeyDown({
    callback: handleArrowKeyListScrolling,
    keys: ['ArrowDown', 'ArrowUp'],
    disabled: !sections.length || !focusedRowStore,
    keyAction: KeyAction.UP,
    preventDefault: true,
    shouldTriggerInInput: true,
  })

  return (
    // Web `fill` is `flex: 1 1 auto`, so without a 0 basis the content height squeezes the header.
    <Flex ref={containerRef} fill flexBasis={0}>
      {/* Focus is a store, not `extraData`: rows subscribe to their own index, so moving focus re-renders two
          rows instead of every mounted cell. */}
      <FocusedRowStoreContext.Provider value={focusedRowStore}>
        <UniversalList
          ref={listRef}
          data={items}
          estimatedItemSize={ITEM_ROW_HEIGHT}
          getFixedItemSize={getFixedRowHeight}
          getItemType={rowType}
          keyExtractor={rowKey}
          ListEmptyComponent={ListEmptyComponent}
          renderItem={renderRow}
          stickyHeaderIndices={stickyHeaderIndices}
          contentContainerStyle={listContentContainerStyle}
        />
      </FocusedRowStoreContext.Provider>
    </Flex>
  )
}

function OnchainItemListRow<T extends OnchainItemListOption>({
  rowInfo,
}: {
  rowInfo: OnchainItemListData<T>
}): JSX.Element {
  // Not memoized on `rowInfo`: the engine already decides when a cell re-renders (its cell memo on
  // key + item), so a memo here would only add a comparison.
  const content = renderRowContent(rowInfo)

  const fixedHeight = getFixedRowHeight(rowInfo)

  const isHeader = isSectionHeader(rowInfo)

  return (
    <Flex
      alignItems="center"
      // Headers pin via `stickyHeaderIndices`, so they scroll over the rows below. `SectionHeader`
      // paints slightly shorter than the row, and that band has to be opaque or the row bleeds through.
      backgroundColor={isHeader ? '$surface1' : undefined}
      height={fixedHeight}
      // Top-align headers and measured rows (e.g. an animating collection): a measured row's height
      // settles after layout, and centering would re-offset its content on every frame.
      justifyContent={fixedHeight === undefined || isHeader ? 'flex-start' : 'center'}
    >
      <Flex width="100%">{content}</Flex>
    </Flex>
  )
}
