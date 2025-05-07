import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'

describe(isSwapListLoading, () => {
  it('returns true if loading and no sections', () => {
    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: undefined,
        trendingSection: undefined,
        isTestnetModeEnabled: false,
      }),
    ).toBe(true)
  })

  it('returns false if loading, testnet mode is on, portfolioSection is defined, and trendingSection is undefined', () => {
    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: [{ sectionKey: OnchainItemSectionName.YourTokens, data: [] }],
        trendingSection: undefined,
        isTestnetModeEnabled: true,
      }),
    ).toBe(false)
  })

  it('returns false if loading and sections are defined', () => {
    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: [{ sectionKey: OnchainItemSectionName.YourTokens, data: [] }],
        trendingSection: [{ sectionKey: OnchainItemSectionName.TrendingTokens, data: [] }],
        isTestnetModeEnabled: false,
      }),
    ).toBe(false)

    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: [{ sectionKey: OnchainItemSectionName.YourTokens, data: [] }],
        trendingSection: [{ sectionKey: OnchainItemSectionName.TrendingTokens, data: [] }],
        isTestnetModeEnabled: true,
      }),
    ).toBe(false)
  })
})
