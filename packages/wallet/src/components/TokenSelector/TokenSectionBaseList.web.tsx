import { CSSProperties, Key, useEffect, useMemo, useRef } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList as List } from 'react-window'
import { Flex } from 'ui/src'
import {
  ItemRowInfo,
  SectionRowInfo,
  TokenSectionBaseListProps,
} from 'wallet/src/components/TokenSelector/TokenSectionBaseList'

const SECTION_HEADER_HEIGHT = 40
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

  function getItemSize(index: number): number {
    const item = items[index]
    if (!item) {
      return 0
    } else if (isSectionHeader(item)) {
      return SECTION_HEADER_HEIGHT
    }
    return ITEM_ROW_HEIGHT
  }

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
              itemSize={getItemSize}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ overflowX: 'clip' }}
              width="100%">
              {TokenSectionBaseListRow}
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
}: {
  index: number
  data: BaseListData
  style: CSSProperties
}): JSX.Element {
  const itemData = data[index]

  return (
    <Flex
      key={itemData?.key ?? index}
      row
      // eslint-disable-next-line react-native/no-inline-styles
      style={{ ...style, overflowX: 'scroll' }}>
      {itemData &&
        (isSectionHeader(itemData)
          ? itemData.renderSectionHeader?.(itemData)
          : itemData.renderItem(itemData))}
    </Flex>
  )
}
