import type { TokenSection } from 'uniswap/src/components/TokenSelector/types'
import type {
  ItemRowInfo,
  SectionRowInfo,
} from 'uniswap/src/components/lists/TokenSectionBaseList/TokenSectionBaseList'
import type { TokenSectionHeaderProps } from 'uniswap/src/components/lists/TokenSectionHeader'
import { ItemType } from 'uniswap/src/components/lists/types'

export enum ProcessedRowType {
  Header = 'header',
  Item = 'item',
}

export type ProcessedRow =
  | { type: ProcessedRowType.Header; data: SectionRowInfo }
  | { type: ProcessedRowType.Item; data: ItemRowInfo<ItemType> }

export function processTokenSections(sections: TokenSection<ItemType>[]): ProcessedRow[] {
  const result: ProcessedRow[] = []

  for (const section of sections) {
    // process header
    const headerProps: TokenSectionHeaderProps = {
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
          // expanded is not used in native :thinking:
          expanded: false,
        },
      })
    }
  }

  return result
}
