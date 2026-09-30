import { CategoryOptionItem } from 'uniswap/src/components/lists/items/categories/CategoryOptionItem'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { type TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

const category: TokenCategory = {
  id: 'defi',
  name: 'DeFi',
  description: '',
  categoryClass: TokenCategoryClass.Sector,
  grouped: false,
  stats: {
    tokenCount: 42,
    priceChange24hPct: 3.2,
    volume1h: 0,
    volume1d: 0,
    volume1w: 0,
    volume1m: 0,
    volume1y: 0,
  },
  topTokens: [
    { chainId: 1, address: '0x1', symbol: 'UNI', logoUrl: 'https://logos.test/uni.png' },
    { chainId: 1, address: '0x2', symbol: 'AAVE', logoUrl: 'https://logos.test/aave.png' },
  ],
}

describe('CategoryOptionItem', () => {
  // The test i18n returns keys verbatim (plural keys included), so labels are asserted on their keys.
  it('renders the name, the Collection label, the token count, and the logo pile', () => {
    const { getByText, getAllByTestId } = render(
      <CategoryOptionItem option={{ type: OnchainItemListOptionType.Category, category }} onPress={vi.fn()} />,
    )
    expect(getByText('DeFi')).toBeTruthy()
    expect(getByText('explore.collections.single')).toBeTruthy()
    expect(getByText(/categoryDetails.tokenCount/)).toBeTruthy()
    expect(getAllByTestId('token-logo')).toHaveLength(2)
  })

  it('omits the token count when the category has no stats', () => {
    const { queryByText } = render(
      <CategoryOptionItem
        option={{ type: OnchainItemListOptionType.Category, category: { ...category, stats: undefined } }}
        onPress={vi.fn()}
      />,
    )
    expect(queryByText(/categoryDetails.tokenCount/)).toBeNull()
  })

  it('calls onPress when the row is pressed', () => {
    const onPress = vi.fn()
    const { getByTestId } = render(
      <CategoryOptionItem option={{ type: OnchainItemListOptionType.Category, category }} onPress={onPress} />,
    )
    fireEvent.press(getByTestId('search-category-row-defi'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
