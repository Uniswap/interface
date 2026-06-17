import { PortfolioRelativeChange } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioRelativeChange'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { render } from 'uniswap/src/test/test-utils'

type Props = React.ComponentProps<typeof PortfolioRelativeChange>

function renderChange(overrides: Partial<Props> = {}): ReturnType<typeof render> {
  const props: Props = {
    isLoading: false,
    isWarmLoading: false,
    hasError: false,
    percentChange: 1.23,
    ...overrides,
  }
  return render(<PortfolioRelativeChange {...props} />)
}

describe(PortfolioRelativeChange, () => {
  it('renders the relative change with the provided percent change', () => {
    const { queryByTestId } = renderChange({ percentChange: 1.23 })

    expect(queryByTestId(TestID.PortfolioRelativeChange)).toBeTruthy()
  })

  it('renders while loading', () => {
    const { queryByTestId } = renderChange({ percentChange: undefined, isLoading: true })

    expect(queryByTestId(TestID.PortfolioRelativeChange)).toBeTruthy()
  })
})
