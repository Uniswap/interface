import { TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'

describe(isSwapListLoading, () => {
  it('returns true if loading and no sections', () => {
    expect(isSwapListLoading(true, undefined, undefined)).toBe(true)
  })

  it('returns false if loading and sections', () => {
    expect(
      isSwapListLoading(
        true,
        [{ sectionKey: TokenOptionSection.YourTokens, data: [] }],
        [{ sectionKey: TokenOptionSection.PopularTokens, data: [] }],
      ),
    ).toBe(false)
  })
})
