import { TestID } from '@universe/test'
import { CategoryFilterEmptyState } from 'uniswap/src/components/TokenSelector/categoryFilters/CategoryFilterEmptyState'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

describe('CategoryFilterEmptyState', () => {
  it('renders the clear action and fires the handler', () => {
    const onClearFilters = vi.fn()
    const { getByText, getByTestId } = render(
      <CategoryFilterEmptyState activeFilterCount={2} searchFilter="uniswap" onClearFilters={onClearFilters} />,
    )
    expect(getByText('tokens.selector.categoryFilter.clear')).toBeTruthy()
    fireEvent.press(getByTestId(TestID.TokenSelectorClearCategoryFilters))
    expect(onClearFilters).toHaveBeenCalledTimes(1)
  })
})
