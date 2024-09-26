import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import React, { CSSProperties, Key, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList as List } from 'react-window'
import { Flex, useWindowDimensions } from 'ui/src'
import { zIndices } from 'ui/src/theme'
import {
  ItemRowInfo,
  SectionRowInfo,
  TokenSectionBaseListProps,
} from 'uniswap/src/components/TokenSelector/TokenSectionBaseList'
import { isSuggestedTokenSection } from 'uniswap/src/components/TokenSelector/TokenSelectorList'

export const ITEM_SECTION_HEADER_ROW_HEIGHT = 40
const ITEM_ROW_HEIGHT = 68

type BaseListRowInfo = {
  key: Key | undefined
}
type BaseListSectionRowInfo = SectionRowInfo & BaseListRowInfo & Pick<TokenSectionBaseListProps, 'renderSectionHeader'>
type BaseListItemRowInfo = ItemRowInfo & BaseListRowInfo & Pick<TokenSectionBaseListProps, 'renderItem'>

type BaseListData = BaseListItemRowInfo | BaseListSectionRowInfo

function isSectionHeader(rowInfo: BaseListData): rowInfo is BaseListSectionRowInfo {
  return !('renderItem' in rowInfo)
}

function isSuggestedTokenRowInfo(rowInfo: BaseListData): boolean {
  const isHeader = isSectionHeader(rowInfo)
  return !isHeader && isSuggestedTokenSection(rowInfo.section)
}

export function TokenSectionBaseList({
  ListEmptyComponent,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  sections,
  sectionListRef,
}: TokenSectionBaseListProps): JSX.Element {
  const ref = useRef<List>(null)
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
            listIndex += section?.data?.length ?? 0
          }
          listIndex += itemIndex

          ref.current?.scrollToItem(listIndex)
        },
      }
    }
  }, [sectionListRef, sections])

  const items = useMemo(() => {
    return sections.reduce((acc: BaseListData[], section) => {
      const sectionInfo: BaseListSectionRowInfo = {
        section: { sectionKey: section.sectionKey, rightElement: section.rightElement },
        key: section.sectionKey,
        renderSectionHeader,
      }
      if (!isSuggestedTokenSection(section)) {
        acc.push(sectionInfo)
      }

      return acc.concat(
        section.data.map((item, index) => {
          const itemInfo: BaseListItemRowInfo = {
            item,
            section,
            index,
            key: keyExtractor?.(item, index),
            renderItem,
          }
          return itemInfo
        }),
      )
    }, [])
  }, [sections, renderSectionHeader, keyExtractor, renderItem])

  const activeSessionIndex = useMemo(() => {
    return items.slice(0, firstVisibleIndex + 1).reduceRight((acc, item, index) => {
      return acc === -1 && isSectionHeader(item) ? index : acc
    }, -1)
  }, [firstVisibleIndex, items])

  useEffect(() => {
    rowHeightMap.current = {}
  }, [items])

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

      if (isSuggestedTokenRowInfo(item)) {
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
    ({ data, index, style }: { data: BaseListData[]; index: number; style: CSSProperties }) => {
      if (activeSessionIndex === index) {
        return null
      }

      return (
        <TokenSectionBaseListRow
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

  return (
    <Flex grow maxHeight="100dvh">
      {!sections.length && ListEmptyComponent}
      <AutoSizer disableWidth>
        {({ height }: { height: number }): JSX.Element => {
          return (
            <Flex position="relative">
              <Flex position="absolute" top={-1} width="100%" zIndex={zIndices.sticky}>
                {activeSessionIndex >= 0 && (
                  <TokenSectionBaseListRow data={items} index={activeSessionIndex} windowWidth={windowWidth} />
                )}
              </Flex>
              <List
                ref={ref}
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

function TokenSectionBaseListRow({
  index,
  data,
  style,
  windowWidth,
  updateRowHeight,
}: {
  index: number
  data: BaseListData[]
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

type RowProps = {
  index: number
  itemData: BaseListItemRowInfo | BaseListSectionRowInfo
  style?: CSSProperties
  windowWidth: number
  updateRowHeight?: (index: number, height: number) => void
}
function _Row({ index, itemData, style, windowWidth, updateRowHeight }: RowProps): JSX.Element {
  const rowRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // We need to run this in the next tick to get the correct height.
    setTimeout(() => {
      const height = rowRef.current?.getBoundingClientRect().height
      if (!height || !updateRowHeight) {
        return
      }
      updateRowHeight(index, height)
    }, 0)
  }, [updateRowHeight, index, windowWidth, itemData.key])

  return (
    <Flex key={itemData?.key ?? index} grow alignItems="center" justifyContent="center" style={style}>
      <Flex ref={rowRef} grow width="100%">
        {itemData &&
          (isSectionHeader(itemData) ? itemData.renderSectionHeader?.(itemData) : itemData.renderItem(itemData))}
      </Flex>
    </Flex>
  )
}

const Row = React.memo(_Row, isEqual)
