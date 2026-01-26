import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'

describe(isSwapListLoading, () => {
  it('returns true if loading and no portfolio section', () => {
    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: undefined,
        isTestnetModeEnabled: false,
      }),
    ).toBe(true)
  })

  it('returns false if loading and portfolioSection is defined', () => {
    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: [{ sectionKey: OnchainItemSectionName.YourTokens, data: [] }],
        isTestnetModeEnabled: false,
      }),
    ).toBe(false)

    expect(
      isSwapListLoading({
        loading: true,
        portfolioSection: [{ sectionKey: OnchainItemSectionName.YourTokens, data: [] }],
        isTestnetModeEnabled: true,
      }),
    ).toBe(false)
  })
})
