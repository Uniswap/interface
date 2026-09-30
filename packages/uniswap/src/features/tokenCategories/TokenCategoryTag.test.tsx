import { TokenCategoryTag } from 'uniswap/src/features/tokenCategories/TokenCategoryTag'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { mockUniswapContext } from 'uniswap/src/test/render'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

describe('TokenCategoryTag', () => {
  it('renders the category name', () => {
    const category = tokenCategory({ id: 'stocks', name: 'Stocks', categoryClass: TokenCategoryClass.Asset })
    const { queryByText } = render(<TokenCategoryTag category={category} />)
    expect(queryByText('Stocks')).not.toBeNull()
  })

  it('renders the localized name as-is', () => {
    const category = tokenCategory({ id: 'stocks', name: 'Acciones', categoryClass: TokenCategoryClass.Asset })
    const { queryByText } = render(<TokenCategoryTag category={category} />)
    expect(queryByText('Acciones')).not.toBeNull()
  })

  it('renders a text-only pill (no icon) for any category', () => {
    const category = tokenCategory({ id: 'gaming', name: 'Gaming', categoryClass: TokenCategoryClass.Sector })
    const { queryByText, queryByTestId } = render(<TokenCategoryTag category={category} />)
    expect(queryByText('Gaming')).not.toBeNull()
    expect(queryByTestId('token-category-tag-icon')).toBeNull()
  })

  it('opens the category detail page on press', () => {
    const category = tokenCategory({ id: 'defi', name: 'DeFi', categoryClass: TokenCategoryClass.Sector })
    const { getByText } = render(<TokenCategoryTag category={category} />)
    fireEvent.press(getByText('DeFi'))
    expect(mockUniswapContext.navigateToCategoryDetails).toHaveBeenCalledWith({ categoryId: 'defi' })
  })
})
