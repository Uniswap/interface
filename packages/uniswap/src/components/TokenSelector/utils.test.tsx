import { TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'

describe(isSwapListLoading, () => {
  it('returns true if loading and no sections', () => {
    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: undefined,
        popularSection: undefined,
        isTestnetModeEnabled: false,
      }),
    ).toBe(true)
  })

  it('returns false if loading, testnet mode is on, portfolioSection is defined, and popularSection is undefined', () => {
    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: [{ sectionKey: TokenOptionSection.YourTokens, data: [] }],
        popularSection: undefined,
        isTestnetModeEnabled: true,
      }),
    ).toBe(false)
  })

  it('returns false if loading and sections are defined', () => {
    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: [{ sectionKey: TokenOptionSection.YourTokens, data: [] }],
        popularSection: [{ sectionKey: TokenOptionSection.PopularTokens, data: [] }],
        isTestnetModeEnabled: false,
      }),
    ).toBe(false)

    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: [{ sectionKey: TokenOptionSection.YourTokens, data: [] }],
        popularSection: [{ sectionKey: TokenOptionSection.PopularTokens, data: [] }],
        isTestnetModeEnabled: true,
      }),
    ).toBe(false)
  })
})
