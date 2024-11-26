import { SortButton } from 'src/components/explore/SortButton'
import { render } from 'src/test/test-utils'
import { CustomRankingType, ExploreOrderBy, RankingType } from 'wallet/src/features/wallet/types'

jest.mock('react-native-context-menu-view', () => {
  // Use the actual implementation of `react-native-context-menu-view` as the mock implementation
  // (we use mock just to get the props of the component in test)
  return jest.fn(jest.requireActual('react-native-context-menu-view').default)
})

describe('SortButton', () => {
  it('renders without error', () => {
    const tree = render(<SortButton orderBy={RankingType.Volume} />)

    expect(tree).toMatchSnapshot()
  })

  const cases: Array<{ test: string; orderBy: ExploreOrderBy; label: string }> = [
    { test: 'volume', orderBy: RankingType.Volume, label: 'Volume' },
    { test: 'total value locked', orderBy: RankingType.TotalValueLocked, label: 'TVL' },
    { test: 'market cap', orderBy: RankingType.MarketCap, label: 'Market cap' },
    {
      test: 'price increase',
      orderBy: CustomRankingType.PricePercentChange1DayDesc,
      label: 'Price increase',
    },
    {
      test: 'price decrease',
      orderBy: CustomRankingType.PricePercentChange1DayAsc,
      label: 'Price decrease',
    },
  ]

  describe.each(cases)('when ordering by $test', ({ orderBy, label }) => {
    it(`renders ${label} as the selected option`, () => {
      const { queryByText } = render(<SortButton orderBy={orderBy} />)
      const selectedOption = queryByText(label)

      expect(selectedOption).toBeTruthy()
    })
  })
})
