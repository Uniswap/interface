import type { TokenSectionHeaderProps } from 'uniswap/src/components/TokenSelector/items/TokenSectionHeader'
import type {
  ItemRowInfo,
  SectionRowInfo,
} from 'uniswap/src/components/TokenSelector/lists/TokenSectionBaseList/TokenSectionBaseList'
import type { TokenSection } from 'uniswap/src/components/TokenSelector/types'

export enum ProcessedRowType {
  Header = 'header',
  Item = 'item',
  Footer = 'footer',
}

export type ProcessedRow =
  | { type: ProcessedRowType.Header; data: SectionRowInfo }
  | { type: ProcessedRowType.Item; data: ItemRowInfo }
  | { type: ProcessedRowType.Footer; data: SectionRowInfo }

export function processTokenSections(sections: TokenSection[]): ProcessedRow[] {
  const resultSize = sections.reduce((acc, section) => {
    const dataLength = section.data.length
    return acc + (section.name ? 1 : 0) + dataLength
  }, 0)

  const result: ProcessedRow[] = new Array(resultSize)
  let index = 0

  for (const section of sections) {
    // process header
    const headerProps: TokenSectionHeaderProps = {
      sectionKey: section.sectionKey,
      rightElement: section.rightElement,
      endElement: section.endElement,
      name: section.name,
    }

    result[index++] = {
      type: ProcessedRowType.Header,
      data: {
        section: headerProps,
      },
    }

    // process items
    const tokenData = section.data
    let itemIndex = 0

    for (const item of tokenData) {
      result[index++] = {
        type: ProcessedRowType.Item,
        data: {
          item,
          section,
          index: itemIndex++,
          // expanded is not used in native :thinking:
          expanded: false,
        },
      }
    }

    result[index++] = {
      type: ProcessedRowType.Footer,
      data: {
        section: headerProps,
      },
    }
  }

  return result
}
