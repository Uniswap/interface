import isArray from 'lodash/isArray'
import type { Key } from 'react'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import {
  ItemRowInfo,
  OnchainItemListProps,
  SectionRowInfo,
} from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { toSectionHeaderProps } from 'uniswap/src/components/lists/OnchainItemList/processSectionsToRows'
import {
  getSectionFooterRowKey,
  getSectionHeaderRowKey,
  getSectionItemRowKey,
  getSectionRowId,
} from 'uniswap/src/components/lists/OnchainItemList/rowKeys'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'

type OnchainItemListRowInfo = {
  key: Key | undefined
  measurementKey: string
}
export type ListSectionRowInfo<T extends OnchainItemListOption> = SectionRowInfo &
  OnchainItemListRowInfo &
  Pick<OnchainItemListProps<T>, 'renderSectionHeader'>
export type ListItemRowInfo<T extends OnchainItemListOption> = ItemRowInfo<T> &
  OnchainItemListRowInfo &
  Pick<OnchainItemListProps<T>, 'renderItem'>

export type ListSectionFooterRowInfo = OnchainItemListRowInfo & { footerElement: JSX.Element }

export type OnchainItemListData<T extends OnchainItemListOption> =
  | ListItemRowInfo<T>
  | ListSectionRowInfo<T>
  | ListSectionFooterRowInfo

export function isSectionHeader<T extends OnchainItemListOption>(
  rowInfo: OnchainItemListData<T>,
): rowInfo is ListSectionRowInfo<T> {
  return 'section' in rowInfo && !('renderItem' in rowInfo)
}

export function isSectionFooter<T extends OnchainItemListOption>(
  rowInfo: OnchainItemListData<T>,
): rowInfo is ListSectionFooterRowInfo {
  return 'footerElement' in rowInfo
}

function isItemRowInfo<T extends OnchainItemListOption>(
  rowInfo: OnchainItemListData<T>,
): rowInfo is ListItemRowInfo<T> {
  return 'renderItem' in rowInfo
}

export function isHorizontalTokenRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  return isItemRowInfo(rowInfo) && isArray(rowInfo.item)
}

export function isDynamicHeightRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  // Footers are arbitrary elements, so they're measured rather than assigned a height.
  if (isSectionFooter(rowInfo) || isHorizontalTokenRowInfo(rowInfo)) {
    return true
  }
  // Rows that opt into dynamic height via `rowLayout` (e.g. expandable collections) are measured at runtime;
  // fixed rows are not. Keeping fixed rows off the dynamic path avoids a needless ResizeObserver +
  // per-commit getBoundingClientRect.
  return isItemRowInfo(rowInfo) && !isArray(rowInfo.item) && rowInfo.item.rowLayout?.dynamicHeight === true
}

/** Section headers/footers and horizontal rows (recent-search pills) have no focus state. */
export function isFocusableRowInfo<T extends OnchainItemListOption>(rowInfo: OnchainItemListData<T>): boolean {
  return isItemRowInfo(rowInfo) && !isHorizontalTokenRowInfo(rowInfo)
}

/** Nearest focusable row at or past `from`, walking in `direction`; undefined when there is none. */
export function findFocusableRowIndex<T extends OnchainItemListOption>({
  items,
  from,
  direction,
}: {
  items: OnchainItemListData<T>[]
  from: number
  direction: 1 | -1
}): number | undefined {
  for (let index = from; index >= 0 && index < items.length; index += direction) {
    const rowInfo = items[index]
    if (rowInfo && isFocusableRowInfo(rowInfo)) {
      return index
    }
  }
  return undefined
}

export function getFirstFocusableRowIndex<T extends OnchainItemListOption>(
  items: OnchainItemListData<T>[],
): number | undefined {
  return findFocusableRowIndex({ items, from: 0, direction: 1 })
}

/** Web renders no row for the Suggested Tokens header (SectionHeader returns null for it anyway). */
export function hasWebHeaderRow(section: { sectionKey: OnchainItemSectionName }): boolean {
  return section.sectionKey !== OnchainItemSectionName.SuggestedTokens
}

/** Flattens sections into the web list's rows: a header (except Suggested), the items, then the optional footer. */
export function toWebListRows<T extends OnchainItemListOption>({
  sections,
  renderSectionHeader,
  renderItem,
  keyExtractor,
  expandedItems,
}: Pick<
  OnchainItemListProps<T>,
  'sections' | 'renderSectionHeader' | 'renderItem' | 'keyExtractor' | 'expandedItems'
>): OnchainItemListData<T>[] {
  const rows: OnchainItemListData<T>[] = []
  for (const section of sections) {
    const sectionRowId = getSectionRowId(section)
    if (hasWebHeaderRow(section)) {
      rows.push({
        section: toSectionHeaderProps(section),
        key: sectionRowId,
        measurementKey: getSectionHeaderRowKey(sectionRowId),
        renderSectionHeader,
      })
    }
    section.data.forEach((item, index) => {
      const itemKey = keyExtractor?.(item, index)
      rows.push({
        item,
        // rowIndex is the row's position in the flat list, which focus and keyboard scrolling index by.
        rowIndex: rows.length,
        section,
        index,
        key: itemKey,
        measurementKey: getSectionItemRowKey({ sectionRowId, itemKey, index }),
        renderItem,
        expanded: expandedItems?.includes(itemKey ?? '') ?? false,
      })
    })
    if (section.footerElement) {
      const footerRowKey = getSectionFooterRowKey(sectionRowId)
      rows.push({ key: footerRowKey, measurementKey: footerRowKey, footerElement: section.footerElement })
    }
  }
  return rows
}
