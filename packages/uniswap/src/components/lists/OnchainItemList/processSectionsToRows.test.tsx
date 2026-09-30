import { Token } from '@uniswap/sdk-core'
import { OnchainItemListOptionType, type TokenOption } from 'uniswap/src/components/lists/items/types'
import {
  ProcessedRow,
  ProcessedRowType,
  processSectionsToRows,
  toFlatRowIndex,
} from 'uniswap/src/components/lists/OnchainItemList/processSectionsToRows'
import { hasWebHeaderRow, toWebListRows } from 'uniswap/src/components/lists/OnchainItemList/rowInfo'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { benignSafetyInfo } from 'uniswap/src/test/fixtures'

describe('processSectionsToRows', () => {
  const mockToken = new Token(
    1, // chainId
    '0x1234567890123456789012345678901234567890', // address
    18, // decimals
    'TEST', // symbol
    'Test Token', // name
  )

  const mockCurrencyInfo: CurrencyInfo = {
    currency: mockToken,
    currencyId: 'test-id',
    logoUrl: null,
    safetyInfo: benignSafetyInfo,
    isSpam: false,
  }

  const mockTokenOption: TokenOption = {
    type: OnchainItemListOptionType.Token,
    currencyInfo: mockCurrencyInfo,
    quantity: null,
    balanceUSD: null,
  }

  const createMockTokenSection = (
    sectionKey: OnchainItemSectionName,
    data: OnchainItemSection<TokenOption>['data'] = [mockTokenOption],
    name?: string,
  ): OnchainItemSection<TokenOption> => ({
    sectionKey,
    data,
    name,
  })

  // Type guard functions
  const isHeaderRow = (row: ProcessedRow): row is Extract<ProcessedRow, { type: ProcessedRowType.Header }> =>
    row.type === ProcessedRowType.Header

  const isItemRow = (row: ProcessedRow): row is Extract<ProcessedRow, { type: ProcessedRowType.Item }> =>
    row.type === ProcessedRowType.Item

  it('processes an empty array of sections', () => {
    const result = processSectionsToRows({ sections: [] })
    expect(result).toEqual([])
  })

  it('processes a single section with one item', () => {
    const section = createMockTokenSection(OnchainItemSectionName.YourTokens, [mockTokenOption], 'Your Tokens')
    const result = processSectionsToRows({ sections: [section] })

    expect(result).toHaveLength(2) // Header + 1 Item

    const [header, item] = result

    if (!header || !item) {
      throw new Error('Expected header and item to be defined')
    }

    expect(isHeaderRow(header)).toBe(true)
    if (isHeaderRow(header)) {
      expect(header.data.section.name).toBe('Your Tokens')
    }

    expect(isItemRow(item)).toBe(true)
    if (isItemRow(item)) {
      expect(item.data.item).toBe(mockTokenOption)
    }
  })

  it('processes multiple sections with multiple items', () => {
    const sections = [
      createMockTokenSection(OnchainItemSectionName.YourTokens, [mockTokenOption, mockTokenOption], 'Your Tokens'),
      createMockTokenSection(OnchainItemSectionName.TrendingTokens, [mockTokenOption], 'Trending Tokens'),
    ]

    const result = processSectionsToRows({ sections })

    expect(result).toHaveLength(5) // (Header + 2 Items) + (Header + 1 Item)

    const [header1, item1a, item1b, header2, item2] = result

    if (!header1 || !item1a || !item1b || !header2 || !item2) {
      throw new Error('Expected all rows to be defined')
    }

    // First section
    expect(isHeaderRow(header1)).toBe(true)
    if (isHeaderRow(header1)) {
      expect(header1.data.section.name).toBe('Your Tokens')
    }

    expect(isItemRow(item1a)).toBe(true)
    expect(isItemRow(item1b)).toBe(true)

    // Second section
    expect(isHeaderRow(header2)).toBe(true)
    if (isHeaderRow(header2)) {
      expect(header2.data.section.name).toBe('Trending Tokens')
    }

    expect(isItemRow(item2)).toBe(true)

    // Check items
    if (isItemRow(item1a) && isItemRow(item1b) && isItemRow(item2)) {
      expect(item1a.data.item).toBe(mockTokenOption)
      expect(item1b.data.item).toBe(mockTokenOption)
      expect(item2.data.item).toBe(mockTokenOption)
    }
  })

  it('preserves section metadata in processed items', () => {
    const rightElement = <>Right</>
    const endElement = <>End</>
    const section: OnchainItemSection<TokenOption> = {
      sectionKey: OnchainItemSectionName.YourTokens,
      data: [mockTokenOption],
      name: 'Your Tokens',
      rightElement,
      endElement,
    }

    const result = processSectionsToRows({ sections: [section] })
    const [header] = result

    if (!header || !isHeaderRow(header)) {
      throw new Error('Expected header to be defined and of type Header')
    }

    expect(header.data.section.rightElement).toBe(rightElement)
    expect(header.data.section.endElement).toBe(endElement)
    expect(header.data.section.sectionKey).toBe(OnchainItemSectionName.YourTokens)
  })

  it('preserves custom section header height metadata in processed headers', () => {
    const section: OnchainItemSection<TokenOption> = {
      sectionKey: OnchainItemSectionName.YourTokens,
      data: [mockTokenOption],
      sectionHeaderHeight: 104,
    }

    const [header] = processSectionsToRows({ sections: [section] })

    if (!header || !isHeaderRow(header)) {
      throw new Error('Expected header to be defined and of type Header')
    }

    expect(header.data.section.sectionHeaderHeight).toBe(104)
  })

  it('correctly sets token item indices within sections', () => {
    const tokens = Array.from({ length: 3 }, (_, i) => ({
      ...mockTokenOption,
      currencyInfo: {
        ...mockCurrencyInfo,
        currencyId: String(i + 1),
      },
    }))

    const section = createMockTokenSection(OnchainItemSectionName.YourTokens, tokens)
    const result = processSectionsToRows({ sections: [section] })
    const items = result.filter(isItemRow)

    items.forEach((item, index) => {
      expect(item.data.index).toBe(index)
      if (!Array.isArray(item.data.item) && item.data.item.type === OnchainItemListOptionType.Token) {
        expect(item.data.item.currencyInfo.currencyId).toBe(String(index + 1))
      }
    })
  })

  it('handles sections without names', () => {
    const section = createMockTokenSection(OnchainItemSectionName.YourTokens, [mockTokenOption])
    delete section.name // Remove the name property

    const result = processSectionsToRows({ sections: [section] })
    const [header] = result

    if (!header || !isHeaderRow(header)) {
      throw new Error('Expected header to be defined and of type Header')
    }

    expect(header.data.section.name).toBeUndefined()
    expect(result).toHaveLength(2) // Should still process header + item
  })

  it('appends a footer row after the section items and keeps it across rebuilds', () => {
    const footerElement = <div>footer</div>
    const sections = [
      { ...createMockTokenSection(OnchainItemSectionName.Tokens), footerElement },
      createMockTokenSection(OnchainItemSectionName.Pools),
    ]

    const rows = processSectionsToRows({ sections })

    expect(rows.map((row) => row.type)).toEqual([
      ProcessedRowType.Header,
      ProcessedRowType.Item,
      ProcessedRowType.Footer,
      ProcessedRowType.Header,
      ProcessedRowType.Item,
    ])
    const footer = rows[2]
    expect(footer?.type === ProcessedRowType.Footer && footer.data.footerElement).toBe(footerElement)
    // The next section's items are stamped past the footer row.
    const nextItem = rows[4]
    expect(nextItem?.type === ProcessedRowType.Item && nextItem.data.rowIndex).toBe(4)

    const rebuilt = processSectionsToRows({ sections: [...sections], previousRows: rows })
    expect(rebuilt[2]).toBe(footer)
  })
})

describe('toFlatRowIndex', () => {
  const mockToken = new Token(1, '0x1234567890123456789012345678901234567890', 18, 'TEST', 'Test Token')

  const mockCurrencyInfo: CurrencyInfo = {
    currency: mockToken,
    currencyId: 'test-id',
    logoUrl: null,
    safetyInfo: benignSafetyInfo,
    isSpam: false,
  }

  const item: TokenOption = {
    type: OnchainItemListOptionType.Token,
    currencyInfo: mockCurrencyInfo,
    quantity: 1,
    balanceUSD: 100,
  }

  const section = (sectionKey: OnchainItemSectionName, count: number): OnchainItemSection<TokenOption> => ({
    sectionKey,
    data: Array.from({ length: count }, () => item),
  })

  // RN's SectionList measures itemIndex from the section header, so 0 is the header itself. This is
  // the case the sole caller exercises: SelectorBaseList resets to the very top with { 0, 0 }.
  it('addresses the section header at itemIndex 0, as SectionList does', () => {
    const sections = [section(OnchainItemSectionName.YourTokens, 3)]

    expect(toFlatRowIndex({ sections, sectionIndex: 0, itemIndex: 0 })).toBe(0)
    expect(toFlatRowIndex({ sections, sectionIndex: 0, itemIndex: 1 })).toBe(1)
    expect(toFlatRowIndex({ sections, sectionIndex: 0, itemIndex: 3 })).toBe(3)
  })

  it('counts the header of every preceding section, not just their items', () => {
    const sections = [section(OnchainItemSectionName.YourTokens, 2), section(OnchainItemSectionName.TrendingTokens, 2)]

    // (header + 2 items) => 3, so the second section's header sits at 3, not 2
    expect(toFlatRowIndex({ sections, sectionIndex: 1, itemIndex: 0 })).toBe(3)
    expect(toFlatRowIndex({ sections, sectionIndex: 1, itemIndex: 1 })).toBe(4)
  })

  it('round-trips against processSectionsToRows for every item', () => {
    const sections = [
      section(OnchainItemSectionName.YourTokens, 2),
      section(OnchainItemSectionName.TrendingTokens, 1),
      section(OnchainItemSectionName.SearchResults, 3),
    ]
    const rows = processSectionsToRows({ sections })

    sections.forEach((s, sectionIndex) => {
      s.data.forEach((_, itemOrdinal) => {
        // +1 because itemIndex counts the header, so the section's first item is itemIndex 1.
        const flatIndex = toFlatRowIndex({ sections, sectionIndex, itemIndex: itemOrdinal + 1 })
        const row = rows[flatIndex]

        expect(row?.type).toBe(ProcessedRowType.Item)
        if (row?.type === ProcessedRowType.Item) {
          expect(row.data.index).toBe(itemOrdinal)
          expect(row.data.section.sectionKey).toBe(s.sectionKey)
          // processSectionsToRows stamps the same flat position it was built at
          expect(row.data.rowIndex).toBe(flatIndex)
        }
      })
    })
  })

  it('counts a preceding section footer', () => {
    const sections = [
      { ...section(OnchainItemSectionName.Tokens, 2), footerElement: <div /> },
      section(OnchainItemSectionName.Pools, 1),
    ]
    const rows = processSectionsToRows({ sections })

    const flatIndex = toFlatRowIndex({ sections, sectionIndex: 1, itemIndex: 1 })
    expect(flatIndex).toBe(5)
    expect(rows[flatIndex]?.type).toBe(ProcessedRowType.Item)
  })

  it('matches the web rows when a header has no row', () => {
    const sections = [
      section(OnchainItemSectionName.SuggestedTokens, 2),
      { ...section(OnchainItemSectionName.Tokens, 2), footerElement: <div /> },
      section(OnchainItemSectionName.Pools, 1),
    ]
    const rows = toWebListRows({ sections, renderItem: () => null })

    sections.forEach((s, sectionIndex) => {
      s.data.forEach((_, itemOrdinal) => {
        const flatIndex = toFlatRowIndex({
          sections,
          sectionIndex,
          itemIndex: itemOrdinal + 1,
          hasHeaderRow: hasWebHeaderRow,
        })
        const row = rows[flatIndex]
        expect(row && 'index' in row && row.index).toBe(itemOrdinal)
        expect(row && 'item' in row && row.section.sectionKey).toBe(s.sectionKey)
      })
    })
    // The headerless section's own itemIndex 0 clamps to its first item rather than going negative.
    expect(toFlatRowIndex({ sections, sectionIndex: 0, itemIndex: 0, hasHeaderRow: hasWebHeaderRow })).toBe(0)
  })

  it('treats an empty section as its header alone', () => {
    const sections = [section(OnchainItemSectionName.YourTokens, 0), section(OnchainItemSectionName.TrendingTokens, 1)]

    expect(toFlatRowIndex({ sections, sectionIndex: 1, itemIndex: 0 })).toBe(1)
  })

  it('lands on a header row, which is what scroll-to-top of a section needs', () => {
    const sections = [section(OnchainItemSectionName.YourTokens, 2), section(OnchainItemSectionName.TrendingTokens, 2)]
    const rows = processSectionsToRows({ sections })

    for (const sectionIndex of [0, 1]) {
      const row = rows[toFlatRowIndex({ sections, sectionIndex, itemIndex: 0 })]

      expect(row?.type).toBe(ProcessedRowType.Header)
      if (row?.type === ProcessedRowType.Header) {
        expect(row.data.section.sectionKey).toBe(sections[sectionIndex]?.sectionKey)
      }
    }
  })
})
