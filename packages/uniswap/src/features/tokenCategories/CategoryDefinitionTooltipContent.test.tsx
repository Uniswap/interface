import { TestID } from '@universe/test'
import { CategoryDefinitionTooltipContent } from 'uniswap/src/features/tokenCategories/CategoryDefinitionTooltipContent'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

const trending = tokenCategory({
  id: 'trending',
  name: 'Trending',
  description: 'Tokens with 1D price gain and 1D volume at least 3x higher than 7D average.',
})

describe('CategoryDefinitionTooltipContent', () => {
  it('renders the description only when there is no "View all" handler', () => {
    const { getByText, queryByTestId } = render(<CategoryDefinitionTooltipContent category={trending} />)
    expect(getByText(trending.description)).toBeTruthy()
    expect(queryByTestId(TestID.CategoryDefinitionViewAll)).toBeNull()
  })

  it('renders "View all" and forwards its press', () => {
    const onPressViewAll = vi.fn()
    const { getByTestId } = render(
      <CategoryDefinitionTooltipContent category={trending} onPressViewAll={onPressViewAll} />,
    )
    fireEvent.press(getByTestId(TestID.CategoryDefinitionViewAll))
    expect(onPressViewAll).toHaveBeenCalledTimes(1)
  })
})
