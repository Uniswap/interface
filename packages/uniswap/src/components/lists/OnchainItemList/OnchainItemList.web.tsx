import { Flex } from '@universe/mycelium'
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import React, {
  CSSProperties,
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { StyleProp, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList as List } from 'react-window'
import { zIndexes } from 'ui/src/theme'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import { useRowHeightObserver } from 'uniswap/src/components/lists/OnchainItemList/hooks/useRowHeightObserver'
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
const HORIZONTAL_TOKEN_ROW_HEIGHT = 88
// Pre-measurement fallback only (the search "View all" footer's height); footers are measured.
const SECTION_FOOTER_ROW_HEIGHT = 48

type RowHeightUpdate = {
  index: number
  measurementKey: string
  height: number
}

function getSectionHeaderHeight<T extends OnchainItemListOption>(rowInfo: ListSectionRowInfo<T>): number {
  return rowInfo.section.sectionHeaderHeight ?? ITEM_SECTION_HEADER_ROW_HEIGHT
}

/**
 * react-window fixes the inner element's `height` to the summed row sizes and positions rows absolutely, so
 * `contentContainerStyle` padding has to be added to that height explicitly or the extra scroll extent never appears.
 */
function createInnerElementType(
  contentContainerStyle: StyleProp<ViewStyle> | undefined,
): React.ComponentType<React.HTMLAttributes<HTMLDivElement>> | undefined {
  if (!contentContainerStyle) {
    return undefined
  }
  const flattened = StyleSheet.flatten(contentContainerStyle) as CSSProperties
  const paddingTop = typeof flattened.paddingTop === 'number' ? flattened.paddingTop : 0
  const paddingBottom = typeof flattened.paddingBottom === 'number' ? flattened.paddingBottom : 0

  return forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function ListInner({ style, ...rest }, ref) {
    const height = typeof style?.height === 'number' ? style.height + paddingTop + paddingBottom : style?.height
    // oxlint-disable-next-line react/forbid-elements -- react-window needs a raw DOM node it can size and ref directly
    return <div ref={ref} style={{ ...style, ...flattened, height, boxSizing: 'border-box' }} {...rest} />
  })
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
  autoFocusFirstRowKey,
  contentContainerStyle,
}: OnchainItemListProps<T>): JSX.Element {
  const ref = useRef<List>(null)
  const listOuterRef = useRef<HTMLDivElement>(null)

  const rowHeightMap = useRef<Record<string, number>>({})
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(-1)
  const { width: windowWidth } = useWindowDimensions()
  const innerElementType = useMemo(() => createInnerElementType(contentContainerStyle), [contentContainerStyle])

  useEffect(() => {
    if (sectionListRef) {
      sectionListRef.current = {
        scrollToLocation: ({ itemIndex, sectionIndex }): void => {
          ref.current?.scrollToItem(
            toFlatRowIndex({ sections, sectionIndex, itemIndex, hasHeaderRow: hasWebHeaderRow }),
          )
        },
      }
    }
  }, [sectionListRef, sections])

  const items = useMemo(
    () => toWebListRows({ sections, renderSectionHeader, renderItem, keyExtractor, expandedItems }),
    [sections, renderSectionHeader, keyExtractor, renderItem, expandedItems],
  )

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

  // Once per key: retries on row-set changes until a focusable row lands, then stops so late sections don't yank focus.
  const focusRow = focusedRowControl?.setFocusedRowIndex
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

  // Used for rendering the sticky header
  const activeSessionIndex = useMemo(() => {
    // oxlint-disable-next-line max-params
    return items.slice(0, firstVisibleIndex + 1).reduceRight((acc, item, index) => {
      return acc === -1 && isSectionHeader(item) ? index : acc
    }, -1)
  }, [firstVisibleIndex, items])

  // Rows measure in their layout effects, which run before the List's ref attaches on the same commit (the List
  // mounts a render after AutoSizer reports a size). Without this, a measurement taken then never invalidates
  // react-window's offset cache and the row stays at its pre-measurement fallback height, e.g. on a cached reopen.
  const pendingResetIndex = useRef<number | undefined>(undefined)

  const updateRowHeight = useCallback(({ index, measurementKey, height }: RowHeightUpdate) => {
    if (rowHeightMap.current[measurementKey] === height) {
      return
    }
    rowHeightMap.current[measurementKey] = height
    if (ref.current) {
      ref.current.resetAfterIndex(index)
    } else {
      pendingResetIndex.current = Math.min(pendingResetIndex.current ?? index, index)
    }
  }, [])

  const setListRef = useCallback((list: List | null): void => {
    ref.current = list
    if (list && pendingResetIndex.current !== undefined) {
      list.resetAfterIndex(pendingResetIndex.current)
      pendingResetIndex.current = undefined
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

      if (isSectionFooter(item)) {
        return measuredHeight ?? SECTION_FOOTER_ROW_HEIGHT
      }

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

  // react-window's scrollToItem is unaware of the sticky header overlay, so scrolling up would park the row beneath
  // it. Reserve the height of the header that will be pinned once the row is at the top (its own section's header).
  const scrollRowIntoView = useCallback(
    (index: number): void => {
      const list = ref.current
      const outer = listOuterRef.current
      if (!list || !outer) {
        return
      }

      let rowTop = 0
      for (let i = 0; i < index; i++) {
        rowTop += getRowHeight(i)
      }
      const rowBottom = rowTop + getRowHeight(index)

      let stickyHeaderHeight = 0
      for (let i = index - 1; i >= 0; i--) {
        const row = items[i]
        if (row && isSectionHeader(row)) {
          stickyHeaderHeight = getSectionHeaderHeight(row)
          break
        }
      }

      const { scrollTop, clientHeight } = outer
      if (rowTop < scrollTop + stickyHeaderHeight) {
        list.scrollTo(Math.max(0, rowTop - stickyHeaderHeight))
      } else if (rowBottom > scrollTop + clientHeight) {
        list.scrollTo(rowBottom - clientHeight)
      }
    },
    [getRowHeight, items],
  )

  const focusRowWithKeyboard = useCallback(
    (index: number): void => {
      focusedRowControl?.setFocusedRowIndex(index)
      scrollRowIntoView(index)
    },
    [focusedRowControl, scrollRowIntoView],
  )

  const handleArrowKeyListScrolling = useCallback(
    (event: KeyboardEvent) => {
      if (!focusedRowControl) {
        return
      }
      const { focusedRowIndex } = focusedRowControl

      if (listOuterRef.current) {
        listOuterRef.current.tabIndex = 0
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
    [focusedRowControl, focusRowWithKeyboard, items],
  )

  useKeyDown({
    callback: handleArrowKeyListScrolling,
    keys: ['ArrowDown', 'ArrowUp'],
    disabled: !sections.length || !focusedRowControl,
    keyAction: KeyAction.UP,
    preventDefault: true,
    shouldTriggerInInput: true,
  })

  return (
    // AutoSizer's own element is `height: 0; overflow: visible`, so the list's real pixels escape it and
    // count toward an ancestor scroll container's scrollHeight. Clipping here keeps a list that ends up a
    // fraction of a pixel too tall from putting a second scrollbar on the hosting modal card (CONS-139);
    // popovers (hover cards, row context menus) portal out, so nothing that should escape is clipped.
    <Flex grow maxHeight="100dvh" overflow="hidden">
      {!sections.length && ListEmptyComponent}
      <AutoSizer disableWidth>
        {({ scaledHeight }: { scaledHeight: number }): JSX.Element => {
          if (!sections.length) {
            return <Fragment />
          }

          // Fit the list inside the pt=1 wrapper below, measuring off the FRACTIONAL height: AutoSizer's
          // `height` is the parent's integer offsetHeight, which rounds a fractional flex height up, so
          // `height - 1` could still exceed the space available and bring the double scrollbar back.
          const listHeight = Math.max(0, Math.floor(scaledHeight - 1))
          // pt=1 closes the sub-pixel gap react-window leaves above section headers
          return (
            <Flex position="relative" pt={1}>
              <Flex position="absolute" top={0} width="100%" zIndex={zIndexes.sticky}>
                {activeSessionIndex >= 0 && (
                  <OnchainItemListRow data={items} index={activeSessionIndex} windowWidth={windowWidth} />
                )}
              </Flex>
              <List
                ref={setListRef}
                outerRef={listOuterRef}
                height={listHeight}
                itemCount={items.length}
                itemData={items}
                itemKey={(index): string => items[index]?.measurementKey ?? `${index}`}
                itemSize={getRowHeight}
                innerElementType={innerElementType}
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
  itemData: OnchainItemListData<T>
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

    if (isSectionFooter(itemData)) {
      return itemData.footerElement
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

// memo() erases RowInner's type parameter; the cast keeps `T` flowing from the caller's row data.
const Row = React.memo(RowInner, isEqual) as typeof RowInner
