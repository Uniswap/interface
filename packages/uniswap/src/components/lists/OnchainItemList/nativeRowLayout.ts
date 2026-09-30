import { ProcessedRow, ProcessedRowType } from 'uniswap/src/components/lists/OnchainItemList/processSectionsToRows'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'

// Legend List estimates unmeasured rows from the average measured height of their type, so each row shape gets its own.
export enum NativeRowType {
  Header = 'header',
  Item = 'item',
  Footer = 'footer',
  HorizontalItem = 'item-horizontal',
  DynamicHeightItem = 'item-dynamic-height',
}

type NativeRowLayout = {
  type: NativeRowType
  /**
   * Exact heights only. The number positions the row *before* it mounts, which is the whole point — an unmeasured
   * row otherwise falls back to its type's running average. A mounted row still reports its real height on layout
   * and overwrites this, so a wrong number costs a one-frame pop rather than a permanent gap.
   */
  fixedSize: number | undefined
}

/** The row taxonomy lives here only: type and fixed size are derived together so a new row kind can't skew them. */
function classifyNativeRow(row: ProcessedRow): NativeRowLayout {
  if (row.type === ProcessedRowType.Header) {
    return {
      type: NativeRowType.Header,
      // SectionHeader renders nothing for this section (pinned by SectionHeader.test.tsx); the web leg omits the row.
      // Every other header is measured, deliberately ignoring `section.sectionHeaderHeight`
      fixedSize: row.data.section.sectionKey === OnchainItemSectionName.SuggestedTokens ? 0 : undefined,
    }
  }

  if (row.type === ProcessedRowType.Footer) {
    return { type: NativeRowType.Footer, fixedSize: undefined }
  }

  const { item, expanded } = row.data
  if (Array.isArray(item)) {
    return { type: NativeRowType.HorizontalItem, fixedSize: undefined }
  }
  if (item.rowLayout?.dynamicHeight !== true) {
    return { type: NativeRowType.Item, fixedSize: undefined }
  }
  return {
    type: NativeRowType.DynamicHeightItem,
    fixedSize: expanded ? item.rowLayout.expandedHeightPx : item.rowLayout.collapsedHeightPx,
  }
}

export function getNativeRowItemType(row: ProcessedRow): NativeRowType {
  return classifyNativeRow(row).type
}

export function getNativeRowFixedSize(row: ProcessedRow): number | undefined {
  return classifyNativeRow(row).fixedSize
}
