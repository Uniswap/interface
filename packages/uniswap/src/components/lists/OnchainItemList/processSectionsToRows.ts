import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import type { ItemRowInfo, SectionRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import type { SectionHeaderProps } from 'uniswap/src/components/lists/SectionHeader'

export enum ProcessedRowType {
  Header = 'header',
  Item = 'item',
}

export type ProcessedRow =
  | { type: ProcessedRowType.Header; data: SectionRowInfo }
  | { type: ProcessedRowType.Item; data: ItemRowInfo<OnchainItemListOption> }

export function processSectionsToRows(sections: OnchainItemSection<OnchainItemListOption>[]): ProcessedRow[] {
  const result: ProcessedRow[] = []
  let rowIndex = 0

  for (const section of sections) {
    // process header
    const headerProps: SectionHeaderProps = {
      sectionKey: section.sectionKey,
      rightElement: section.rightElement,
      endElement: section.endElement,
      name: section.name,
    }

    result.push({
      type: ProcessedRowType.Header,
      data: {
        section: headerProps,
      },
    })
    rowIndex++

    // process items
    const tokenData = section.data
    let itemIndex = 0

    for (const item of tokenData) {
      result.push({
        type: ProcessedRowType.Item,
        data: {
          item,
          section,
          index: itemIndex++,
          rowIndex: rowIndex++,
          // expanded is not used in native :thinking:
          expanded: false,
        },
      })
    }
  }

  return result
}
