import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import React, { CSSProperties, Fragment, Key, useCallback, useEffect, useMemo, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { LayoutChangeEvent } from 'react-native'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList as List } from 'react-window'
import { Flex, useWindowDimensions } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import {
  ItemRowInfo,
  OnchainItemListProps,
  SectionRowInfo,
} from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { ITEM_SECTION_HEADER_ROW_HEIGHT } from 'uniswap/src/components/TokenSelector/constants'
import { KeyAction } from 'utilities/src/device/keyboard/types'
import { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown'

const ITEM_ROW_HEIGHT = 64

type OnchainItemListRowInfo = {
  key: Key | undefined
}
type ListSectionRowInfo<T extends OnchainItemListOption> = SectionRowInfo &
  OnchainItemListRowInfo &
  Pick<OnchainItemListProps<T>, 'renderSectionHeader'>
type ListItemRowInfo<T extends OnchainItemListOption> = ItemRowInfo<T> &
  OnchainItemListRowInfo &
  Pick<OnchainItemListProps<T>, 'renderItem'>

type OnchainItemListData<T extends OnchainItemListOption> = ListItemRowInfo<T> | ListSectionRowInfo<T>

function isSectionHeader<T extends OnchainItemListOption>(
  rowInfo: OnchainItemListData<T>,
): rowInfo is ListSectionRowInfo<T> {
  return !('renderItem' in rowInfo)
}

function isHorizontalTokenRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  const isHeader = isSectionHeader(rowInfo)
  return !isHeader && isArray(rowInfo.item)
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

  const rowHeightMap = useRef<{ [key: number]: number }>({})
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
            rightElement: section.rightElement,
            endElement: section.endElement,
          },
          key: section.sectionKey,
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

  // Used for rendering the sticky header
  const activeSessionIndex = useMemo(() => {
    // eslint-disable-next-line max-params
    return items.slice(0, firstVisibleIndex + 1).reduceRight((acc, item, index) => {
      return acc === -1 && isSectionHeader(item) ? index : acc
    }, -1)
  }, [firstVisibleIndex, items])

  const updateRowHeight = useCallback((index: number, height: number) => {
    if (rowHeightMap.current[index] !== height) {
      rowHeightMap.current[index] = height
      ref.current?.resetAfterIndex(index)
    }
  }, [])

  const getRowHeight = useCallback(
    (index: number): number => {
      const item = items[index]

      if (!item) {
        return 0
      }

      if (isHorizontalTokenRowInfo(item)) {
        if (!isSectionHeader(item)) {
          if (isArray(item.item) && !item.item.length) {
            return 0
          }
        }

        const measuredHeight = rowHeightMap.current[index]
        if (measuredHeight) {
          return measuredHeight
        }
      }

      return isSectionHeader(item) ? ITEM_SECTION_HEADER_ROW_HEIGHT : ITEM_ROW_HEIGHT
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
          style={style}
          updateRowHeight={updateRowHeight}
          windowWidth={windowWidth}
        />
      )
    },
    [updateRowHeight, windowWidth, activeSessionIndex],
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
          return (
            <Flex position="relative">
              <Flex position="absolute" top={0} width="100%" zIndex={zIndexes.sticky}>
                {activeSessionIndex >= 0 && (
                  <OnchainItemListRow data={items} index={activeSessionIndex} windowWidth={windowWidth} />
                )}
              </Flex>
              <List
                ref={ref}
                outerRef={listOuterRef}
                height={height}
                itemCount={items.length}
                itemData={items}
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
}: {
  index: number
  data: OnchainItemListData<T>[]
  style?: CSSProperties
  windowWidth: number
  updateRowHeight?: (index: number, height: number) => void
}): JSX.Element {
  const itemData = data[index]

  return (
    <>
      {itemData && (
        <Row
          index={index}
          itemData={itemData}
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
  updateRowHeight?: (index: number, height: number) => void
}
function _Row<T extends OnchainItemListOption>({ index, itemData, style, updateRowHeight }: RowProps<T>): JSX.Element {
  const rowRef = useRef<HTMLElement>(null)

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height
      if (height && updateRowHeight) {
        updateRowHeight(index, height)
      }
    },
    [updateRowHeight, index],
  )

  const item = useMemo((): JSX.Element | null => {
    if (isSectionHeader(itemData)) {
      return itemData.renderSectionHeader?.(itemData) ?? null
    }

    return itemData.renderItem(itemData)
  }, [itemData])

  return (
    <Flex key={itemData.key ?? index} grow alignItems="center" justifyContent="center" style={style}>
      <Flex ref={rowRef} width="100%" onLayout={handleLayout}>
        {item}
      </Flex>
    </Flex>
  )
}

const Row = React.memo(_Row, isEqual)
