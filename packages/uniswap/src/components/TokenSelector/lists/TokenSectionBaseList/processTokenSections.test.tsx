import { Token } from '@uniswap/sdk-core'
import {
  ProcessedRow,
  ProcessedRowType,
  processTokenSections,
} from 'uniswap/src/components/TokenSelector/lists/TokenSectionBaseList/processTokenSections'
import type { TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

describe('processTokenSections', () => {
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
    safetyLevel: SafetyLevel.Verified,
    safetyInfo: null,
    isSpam: false,
  }

  const mockTokenOption: TokenOption = {
    currencyInfo: mockCurrencyInfo,
    quantity: null,
    balanceUSD: null,
  }

  const createMockSection = (
    sectionKey: TokenOptionSection,
    data: TokenSection['data'] = [mockTokenOption],
    name?: string,
  ): TokenSection => ({
    sectionKey,
    data,
    name,
  })

  // Type guard functions
  const isHeaderRow = (row: ProcessedRow): row is Extract<ProcessedRow, { type: ProcessedRowType.Header }> =>
    row.type === ProcessedRowType.Header

  const isItemRow = (row: ProcessedRow): row is Extract<ProcessedRow, { type: ProcessedRowType.Item }> =>
    row.type === ProcessedRowType.Item

  const isFooterRow = (row: ProcessedRow): row is Extract<ProcessedRow, { type: ProcessedRowType.Footer }> =>
    row.type === ProcessedRowType.Footer

  it('processes an empty array of sections', () => {
    const result = processTokenSections([])
    expect(result).toEqual([])
  })

  it('processes a single section with one item', () => {
    const section = createMockSection(TokenOptionSection.YourTokens, [mockTokenOption], 'Your Tokens')
    const result = processTokenSections([section])

    expect(result).toHaveLength(3) // Header + 1 Item + Footer

    const [header, item, footer] = result

    if (!header || !item || !footer) {
      throw new Error('Expected header, item, and footer to be defined')
    }

    expect(isHeaderRow(header)).toBe(true)
    if (isHeaderRow(header)) {
      expect(header.data.section.name).toBe('Your Tokens')
    }

    expect(isItemRow(item)).toBe(true)
    if (isItemRow(item)) {
      expect(item.data.item).toBe(mockTokenOption)
    }

    expect(isFooterRow(footer)).toBe(true)
  })

  it('processes multiple sections with multiple items', () => {
    const sections = [
      createMockSection(TokenOptionSection.YourTokens, [mockTokenOption, mockTokenOption], 'Your Tokens'),
      createMockSection(TokenOptionSection.PopularTokens, [mockTokenOption], 'Popular Tokens'),
    ]

    const result = processTokenSections(sections)

    expect(result).toHaveLength(7) // (Header + 2 Items + Footer) + (Header + 1 Item + Footer)

    const [header1, item1a, item1b, footer1, header2, item2, footer2] = result

    if (!header1 || !item1a || !item1b || !footer1 || !header2 || !item2 || !footer2) {
      throw new Error('Expected all rows to be defined')
    }

    // First section
    expect(isHeaderRow(header1)).toBe(true)
    if (isHeaderRow(header1)) {
      expect(header1.data.section.name).toBe('Your Tokens')
    }

    expect(isItemRow(item1a)).toBe(true)
    expect(isItemRow(item1b)).toBe(true)
    expect(isFooterRow(footer1)).toBe(true)

    // Second section
    expect(isHeaderRow(header2)).toBe(true)
    if (isHeaderRow(header2)) {
      expect(header2.data.section.name).toBe('Popular Tokens')
    }

    expect(isItemRow(item2)).toBe(true)
    expect(isFooterRow(footer2)).toBe(true)

    // Check items
    if (isItemRow(item1a) && isItemRow(item1b) && isItemRow(item2)) {
      expect(item1a.data.item).toBe(mockTokenOption)
      expect(item1b.data.item).toBe(mockTokenOption)
      expect(item2.data.item).toBe(mockTokenOption)
    }
  })

  it('preserves section metadata in processed items', () => {
    const rightElement = <div>Right</div>
    const endElement = <div>End</div>
    const section: TokenSection = {
      sectionKey: TokenOptionSection.YourTokens,
      data: [mockTokenOption],
      name: 'Your Tokens',
      rightElement,
      endElement,
    }

    const result = processTokenSections([section])
    const [header] = result

    if (!header || !isHeaderRow(header)) {
      throw new Error('Expected header to be defined and of type Header')
    }

    expect(header.data.section.rightElement).toBe(rightElement)
    expect(header.data.section.endElement).toBe(endElement)
    expect(header.data.section.sectionKey).toBe(TokenOptionSection.YourTokens)
  })

  it('correctly sets item indices within sections', () => {
    const tokens = Array.from({ length: 3 }, (_, i) => ({
      ...mockTokenOption,
      currencyInfo: {
        ...mockCurrencyInfo,
        currencyId: String(i + 1),
      },
    }))

    const section = createMockSection(TokenOptionSection.YourTokens, tokens)
    const result = processTokenSections([section])
    const items = result.filter(isItemRow)

    items.forEach((item, index) => {
      expect(item.data.index).toBe(index)
      if (!Array.isArray(item.data.item)) {
        expect(item.data.item.currencyInfo.currencyId).toBe(String(index + 1))
      }
    })
  })

  it('handles sections without names', () => {
    const section = createMockSection(TokenOptionSection.YourTokens, [mockTokenOption])
    delete section.name // Remove the name property

    const result = processTokenSections([section])
    const [header] = result

    if (!header || !isHeaderRow(header)) {
      throw new Error('Expected header to be defined and of type Header')
    }

    expect(header.data.section.name).toBeUndefined()
    expect(result).toHaveLength(3) // Should still process header + item + footer
  })
})
