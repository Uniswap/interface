import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import React, {
  CSSProperties,
  Fragment,
  Key,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList as List } from 'react-window'
import { Flex, useWindowDimensions } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import { useRowHeightObserver } from 'uniswap/src/components/lists/OnchainItemList/hooks/useRowHeightObserver'
import {
  ItemRowInfo,
  OnchainItemListProps,
  SectionRowInfo,
} from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import {
  getRowsStructuralSignature,
  getSectionHeaderRowKey,
  getSectionItemRowKey,
} from 'uniswap/src/components/lists/OnchainItemList/rowKeys'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { ITEM_SECTION_HEADER_ROW_HEIGHT } from 'uniswap/src/components/TokenSelector/constants'
import { KeyAction } from 'utilities/src/device/keyboard/types'
import { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown'

const ITEM_ROW_HEIGHT = 64
const HORIZONTAL_TOKEN_ROW_HEIGHT = 88

type OnchainItemListRowInfo = {
  key: Key | undefined
  measurementKey: string
}
type ListSectionRowInfo<T extends OnchainItemListOption> = SectionRowInfo &
  OnchainItemListRowInfo &
  Pick<OnchainItemListProps<T>, 'renderSectionHeader'>
type ListItemRowInfo<T extends OnchainItemListOption> = ItemRowInfo<T> &
  OnchainItemListRowInfo &
  Pick<OnchainItemListProps<T>, 'renderItem'>

type OnchainItemListData<T extends OnchainItemListOption> = ListItemRowInfo<T> | ListSectionRowInfo<T>
type RowHeightUpdate = {
  index: number
  measurementKey: string
  height: number
}

function isSectionHeader<T extends OnchainItemListOption>(
  rowInfo: OnchainItemListData<T>,
): rowInfo is ListSectionRowInfo<T> {
  return !('renderItem' in rowInfo)
}

function isHorizontalTokenRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  const isHeader = isSectionHeader(rowInfo)
  return !isHeader && isArray(rowInfo.item)
}

function isDynamicHeightRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  if (isHorizontalTokenRowInfo(rowInfo)) {
    return true
  }
  // Rows that opt into dynamic height via `rowLayout` (e.g. expandable collections) are measured at runtime;
  // fixed rows are not. Keeping fixed rows off the dynamic path avoids a needless ResizeObserver +
  // per-commit getBoundingClientRect.
  return !isSectionHeader(rowInfo) && !isArray(rowInfo.item) && rowInfo.item.rowLayout?.dynamicHeight === true
}

function getSectionHeaderHeight<T extends OnchainItemListOption>(rowInfo: ListSectionRowInfo<T>): number {
  return rowInfo.section.sectionHeaderHeight ?? ITEM_SECTION_HEADER_ROW_HEIGHT
}

export function OnchainItemList<T extends OnchainItemListOption>({
  ListEmptyComponent,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  sections,
  sectionListRef,
  expandedItems,
  focusedRowControl,
}: OnchainItemListProps<T>): JSX.Element {
  const ref = useRef<List>(null)
  const listOuterRef = useRef<HTMLDivElement>(null)

  const rowHeightMap = useRef<Record<string, number>>({})
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(-1)
  const { width: windowWidth } = useWindowDimensions()

  useEffect(() => {
    if (sectionListRef) {
      sectionListRef.current = {
        scrollToLocation: ({ itemIndex, sectionIndex }): void => {
          let listIndex = 0
          for (let i = 0; i < sectionIndex; i++) {
            const section = sections[i]
            listIndex += section?.data.length ?? 0
          }
          listIndex += itemIndex

          ref.current?.scrollToItem(listIndex)
        },
      }
    }
  }, [sectionListRef, sections])

  const items = useMemo(() => {
    let rowIndex = 0
    return sections.reduce((acc: OnchainItemListData<T>[], section) => {
      if (section.sectionKey !== OnchainItemSectionName.SuggestedTokens) {
        const sectionInfo: ListSectionRowInfo<T> = {
          section: {
            sectionKey: section.sectionKey,
            name: section.name,
            rightElement: section.rightElement,
            endElement: section.endElement,
            sectionHeader: section.sectionHeader,
            sectionHeaderHeight: section.sectionHeaderHeight,
            icon: section.icon,
          },
          key: section.sectionKey,
          measurementKey: getSectionHeaderRowKey(section.sectionKey),
          renderSectionHeader,
        }
        rowIndex += 1
        acc.push(sectionInfo)
      }

      const rows = acc.concat(
        section.data.map((item, index) => {
          const itemInfo: ListItemRowInfo<T> = {
            item,
            rowIndex,
            section,
            index,
            key: keyExtractor?.(item, index),
            measurementKey: getSectionItemRowKey({
              sectionKey: section.sectionKey,
              itemKey: keyExtractor?.(item, index),
              index,
            }),
            renderItem,
            expanded: expandedItems?.includes(keyExtractor?.(item, index) ?? '') ?? false,
          }
          rowIndex += 1
          return itemInfo
        }),
      )

      return rows
    }, [])
  }, [sections, renderSectionHeader, keyExtractor, renderItem, expandedItems])

  // Signature of the row SET (ordered keys, excluding heights/expanded state): changes on insert/remove/reorder
  // (clear recents, tab/filter, refetch) but not on expand/collapse. On change, react-window's index-keyed offset
  // cache is stale — reset from 0; per-key heights survive, so offsets rebuild correctly. SWAP-2781 / SWAP-2785.
  const structuralSignature = useMemo(
    () => getRowsStructuralSignature(items.map((item) => item.measurementKey)),
    [items],
  )

  // Latest-value ref (not a double-exec guard): lets the signature-keyed effect prune without adding `items` to
  // its deps — `items` identity also changes on expand/collapse, which must NOT trigger a reset.
  const itemsRef = useRef(items)
  itemsRef.current = items

  const resetRowOffsets = useCallback((index = 0): void => {
    ref.current?.resetAfterIndex(index)
  }, [])

  useLayoutEffect(() => {
    // Drop heights for rows that left so the map can't grow unbounded.
    const presentKeys = new Set(itemsRef.current.map((item) => item.measurementKey))
    for (const measurementKey of Object.keys(rowHeightMap.current)) {
      if (!presentKeys.has(measurementKey)) {
        delete rowHeightMap.current[measurementKey]
      }
    }
    resetRowOffsets()
  }, [resetRowOffsets, structuralSignature])

  // Used for rendering the sticky header
  const activeSessionIndex = useMemo(() => {
    // oxlint-disable-next-line max-params
    return items.slice(0, firstVisibleIndex + 1).reduceRight((acc, item, index) => {
      return acc === -1 && isSectionHeader(item) ? index : acc
    }, -1)
  }, [firstVisibleIndex, items])

  const updateRowHeight = useCallback(({ index, measurementKey, height }: RowHeightUpdate) => {
    if (rowHeightMap.current[measurementKey] !== height) {
      rowHeightMap.current[measurementKey] = height
      ref.current?.resetAfterIndex(index)
    }
  }, [])

  const getRowHeight = useCallback(
    (index: number): number => {
      const item = items[index]

      if (!item) {
        return 0
      }

      if (isSectionHeader(item)) {
        return getSectionHeaderHeight(item)
      }

      const measuredHeight = rowHeightMap.current[item.measurementKey]

      if (isHorizontalTokenRowInfo(item)) {
        if (isArray(item.item) && !item.item.length) {
          return 0
        }

        if (measuredHeight) {
          return measuredHeight
        }

        return HORIZONTAL_TOKEN_ROW_HEIGHT
      }

      if (isDynamicHeightRowInfo(item)) {
        if (measuredHeight) {
          return measuredHeight
        }
        // Pre-measurement fallback: use the row's own computed layout so first-paint offsets are ~right until the
        // ResizeObserver reports the real height.
        if (!isArray(item.item) && item.item.rowLayout) {
          return item.expanded ? item.item.rowLayout.expandedHeightPx : item.item.rowLayout.collapsedHeightPx
        }
        return ITEM_ROW_HEIGHT
      }

      return ITEM_ROW_HEIGHT
    },
    [items],
  )

  const ListContent = useCallback(
    ({ data, index, style }: { data: OnchainItemListData<T>[]; index: number; style: CSSProperties }) => {
      if (activeSessionIndex === index) {
        return null
      }

      return (
        <OnchainItemListRow
          data={data}
          index={index}
          resetRowOffsets={resetRowOffsets}
          style={style}
          updateRowHeight={updateRowHeight}
          windowWidth={windowWidth}
        />
      )
    },
    [resetRowOffsets, updateRowHeight, windowWidth, activeSessionIndex],
  )

  const handleArrowKeyListScrolling = useCallback(
    (event: KeyboardEvent) => {
      if (!focusedRowControl) {
        return
      }
      const { focusedRowIndex, setFocusedRowIndex } = focusedRowControl

      if (listOuterRef.current) {
        listOuterRef.current.tabIndex = 0
      }

      event.preventDefault()

      const firstItemRowIndex = items.length && items[0] && isSectionHeader(items[0]) ? 1 : 0 // if first row is a header, skip to the next row
      if (focusedRowIndex === undefined) {
        setFocusedRowIndex(firstItemRowIndex)
        return
      }

      if (event.key === 'ArrowDown') {
        const newFocusedIndex = Math.min(items.length - 1, focusedRowIndex + 1)
        const itemAtNewFocusedIndex = items[newFocusedIndex]
        if (itemAtNewFocusedIndex && isSectionHeader(itemAtNewFocusedIndex)) {
          // skip focusing on section header
          setFocusedRowIndex(Math.min(items.length - 1, focusedRowIndex + 2))
        } else {
          setFocusedRowIndex(newFocusedIndex)
        }
      }

      if (event.key === 'ArrowUp') {
        const newFocusedIndex = Math.max(firstItemRowIndex, focusedRowIndex - 1)
        const itemAtNewFocusedIndex = items[newFocusedIndex]
        if (itemAtNewFocusedIndex && isSectionHeader(itemAtNewFocusedIndex)) {
          // skip focusing on section header
          setFocusedRowIndex(Math.max(firstItemRowIndex, focusedRowIndex - 2))
        } else {
          setFocusedRowIndex(newFocusedIndex)
        }
      }
    },
    [focusedRowControl, items],
  )

  useKeyDown({
    callback: handleArrowKeyListScrolling,
    keys: ['ArrowDown', 'ArrowUp'],
    disabled: !sections.length || !focusedRowControl,
    keyAction: KeyAction.UP,
    preventDefault: true,
    shouldTriggerInInput: true,
  })

  useEffect(() => {
    const list = ref.current
    const { focusedRowIndex } = focusedRowControl ?? {}
    if (!list || focusedRowIndex === undefined) {
      return
    }

    list.scrollToItem(focusedRowIndex)
  }, [focusedRowControl])

  return (
    <Flex grow maxHeight="100dvh">
      {!sections.length && ListEmptyComponent}
      <AutoSizer disableWidth>
        {({ height }: { height: number }): JSX.Element => {
          if (!sections.length) {
            return <Fragment />
          }

          // Prevent overfitting the list, resulting in showing double scroll bar
          const correctedHeight = height - 1
          // pt=1 closes the sub-pixel gap react-window leaves above section headers
          return (
            <Flex position="relative" pt={1}>
              <Flex position="absolute" top={0} width="100%" zIndex={zIndexes.sticky}>
                {activeSessionIndex >= 0 && (
                  <OnchainItemListRow data={items} index={activeSessionIndex} windowWidth={windowWidth} />
                )}
              </Flex>
              <List
                ref={ref}
                outerRef={listOuterRef}
                height={correctedHeight}
                itemCount={items.length}
                itemData={items}
                itemKey={(index): string => items[index]?.measurementKey ?? `${index}`}
                itemSize={getRowHeight}
                width="100%"
                onItemsRendered={({ visibleStartIndex }): void => {
                  setFirstVisibleIndex(visibleStartIndex)
                }}
              >
                {ListContent}
              </List>
            </Flex>
          )
        }}
      </AutoSizer>
    </Flex>
  )
}

function OnchainItemListRow<T extends OnchainItemListOption>({
  index,
  data,
  style,
  windowWidth,
  updateRowHeight,
  resetRowOffsets,
}: {
  index: number
  data: OnchainItemListData<T>[]
  style?: CSSProperties
  windowWidth: number
  updateRowHeight?: (params: RowHeightUpdate) => void
  resetRowOffsets?: (index?: number) => void
}): JSX.Element {
  const itemData = data[index]

  return (
    <>
      {itemData && (
        <Row
          index={index}
          itemData={itemData}
          resetRowOffsets={resetRowOffsets}
          style={style}
          updateRowHeight={updateRowHeight}
          windowWidth={windowWidth}
        />
      )}
    </>
  )
}

type RowProps<T extends OnchainItemListOption> = {
  index: number
  itemData: ListItemRowInfo<T> | ListSectionRowInfo<T>
  style?: CSSProperties
  windowWidth: number
  updateRowHeight?: (params: RowHeightUpdate) => void
  resetRowOffsets?: (index?: number) => void
}
function RowInner<T extends OnchainItemListOption>({
  index,
  itemData,
  style,
  updateRowHeight,
  resetRowOffsets,
}: RowProps<T>): JSX.Element {
  const rowRef = useRef<HTMLElement>(null)

  useRowHeightObserver({
    ref: rowRef,
    index,
    measurementKey: itemData.measurementKey,
    updateRowHeight,
    itemKey: itemData.key,
    needsDynamicHeight: isDynamicHeightRowInfo(itemData),
  })

  useLayoutEffect(() => {
    if (!isSectionHeader(itemData) || typeof style?.height !== 'number') {
      return
    }

    if (style.height !== getSectionHeaderHeight(itemData)) {
      resetRowOffsets?.(index)
    }
  }, [index, itemData, resetRowOffsets, style?.height])

  const item = useMemo((): JSX.Element | null => {
    if (isSectionHeader(itemData)) {
      return itemData.renderSectionHeader?.(itemData) ?? null
    }

    return itemData.renderItem(itemData)
  }, [itemData])

  return (
    <Flex
      key={itemData.measurementKey}
      grow
      alignItems="center"
      // Top-align headers and dynamic-height rows (e.g. animating RWA collections): react-window updates cell
      // height async, so centering would re-offset the growing content each frame. Fixed-height rows center.
      justifyContent={isSectionHeader(itemData) || isDynamicHeightRowInfo(itemData) ? 'flex-start' : 'center'}
      style={style}
    >
      <Flex ref={rowRef} width="100%">
        {item}
      </Flex>
    </Flex>
  )
}

const Row = React.memo(RowInner, isEqual)
