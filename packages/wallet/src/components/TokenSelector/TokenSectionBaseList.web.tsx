import { CSSProperties, Key, useCallback, useEffect, useMemo, useRef } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList as List } from 'react-window'
import { useWindowDimensions } from 'tamagui'
import { Flex } from 'ui/src'
import {
  ItemRowInfo,
  SectionRowInfo,
  TokenSectionBaseListProps,
} from 'wallet/src/components/TokenSelector/TokenSectionBaseList'

const ITEM_ROW_HEIGHT = 72

type BaseListRowInfo = {
  key: Key | undefined
}
type BaseListSectionRowInfo = SectionRowInfo &
  BaseListRowInfo &
  Pick<TokenSectionBaseListProps, 'renderSectionHeader'>
type BaseListItemRowInfo = ItemRowInfo &
  BaseListRowInfo &
  Pick<TokenSectionBaseListProps, 'renderItem'>

type BaseListData = (BaseListItemRowInfo | BaseListSectionRowInfo)[]

function isSectionHeader(
  rowInfo: BaseListSectionRowInfo | BaseListItemRowInfo
): rowInfo is BaseListSectionRowInfo {
  return !('renderItem' in rowInfo)
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
    return sections.reduce((acc: BaseListData, section) => {
      const sectionInfo: BaseListSectionRowInfo = {
        section: { title: section.title, rightElement: section.rightElement },
        key: section.title,
        renderSectionHeader,
      }
      acc.push(sectionInfo)

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
        })
      )
    }, [])
  }, [sections, keyExtractor, renderSectionHeader, renderItem])

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
      const measuredHeight = rowHeightMap.current[index]

      if (!item) {
        return 0
      } else if (measuredHeight) {
        return measuredHeight
      }
      return ITEM_ROW_HEIGHT
    },
    [items]
  )

  return (
    <Flex grow>
      {!sections.length && ListEmptyComponent}
      <AutoSizer disableWidth>
        {({ height }: { height: number }): JSX.Element => {
          return (
            <List
              ref={ref}
              height={height}
              itemCount={items.length}
              itemData={items}
              itemSize={getRowHeight}
              width="100%">
              {({ data, index, style }) => (
                <TokenSectionBaseListRow
                  data={data}
                  index={index}
                  style={style}
                  updateRowHeight={updateRowHeight}
                  windowWidth={windowWidth}
                />
              )}
            </List>
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
  data: BaseListData
  style: CSSProperties
  windowWidth: number
  updateRowHeight: (index: number, height: number) => void
}): JSX.Element {
  const rowRef = useRef<HTMLElement>(null)
  const itemData = data[index]

  useEffect(() => {
    const height = rowRef.current?.getBoundingClientRect().height
    if (height) {
      updateRowHeight(index, height)
    }
  }, [updateRowHeight, index, windowWidth])

  return (
    <Flex key={itemData?.key ?? index} style={style}>
      <Flex ref={rowRef}>
        {itemData &&
          (isSectionHeader(itemData)
            ? itemData.renderSectionHeader?.(itemData)
            : itemData.renderItem(itemData))}
      </Flex>
    </Flex>
  )
}
