import { Token } from '@uniswap/sdk-core'
import {
  ProcessedRow,
  ProcessedRowType,
  processTokenSections,
} from 'uniswap/src/components/lists/TokenSectionBaseList/processTokenSections'
import type { TokenOption } from 'uniswap/src/components/lists/types'
import type { TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { benignSafetyInfo } from 'uniswap/src/test/fixtures'

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
    safetyInfo: benignSafetyInfo,
    isSpam: false,
  }

  const mockTokenOption: TokenOption = {
    currencyInfo: mockCurrencyInfo,
    quantity: null,
    balanceUSD: null,
  }

  const createMockTokenSection = (
    sectionKey: TokenOptionSection,
    data: TokenSection<TokenOption>['data'] = [mockTokenOption],
    name?: string,
  ): TokenSection<TokenOption> => ({
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
    const result = processTokenSections([])
    expect(result).toEqual([])
  })

  it('processes a single section with one item', () => {
    const section = createMockTokenSection(TokenOptionSection.YourTokens, [mockTokenOption], 'Your Tokens')
    const result = processTokenSections([section])

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
      createMockTokenSection(TokenOptionSection.YourTokens, [mockTokenOption, mockTokenOption], 'Your Tokens'),
      createMockTokenSection(TokenOptionSection.PopularTokens, [mockTokenOption], 'Popular Tokens'),
    ]

    const result = processTokenSections(sections)

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
      expect(header2.data.section.name).toBe('Popular Tokens')
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
    const section: TokenSection<TokenOption> = {
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

    const section = createMockTokenSection(TokenOptionSection.YourTokens, tokens)
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
    const section = createMockTokenSection(TokenOptionSection.YourTokens, [mockTokenOption])
    delete section.name // Remove the name property

    const result = processTokenSections([section])
    const [header] = result

    if (!header || !isHeaderRow(header)) {
      throw new Error('Expected header to be defined and of type Header')
    }

    expect(header.data.section.name).toBeUndefined()
    expect(result).toHaveLength(2) // Should still process header + item
  })
})
