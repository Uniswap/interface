import { CustomRankingType, RankingType } from '@universe/api'
import { SortButton } from 'src/components/explore/SortButton'
import { act, render } from 'src/test/test-utils'
import { ExploreOrderBy } from 'wallet/src/features/wallet/types'

jest.mock('react-native-context-menu-view', () => {
  // Use the actual implementation of `react-native-context-menu-view` as the mock implementation
  // (we use mock just to get the props of the component in test)
  return jest.fn(jest.requireActual('react-native-context-menu-view').default)
})

describe('SortButton', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders without error', async () => {
    const tree = render(<SortButton orderBy={RankingType.Volume} onOrderByChange={() => {}} />)

    await act(async () => {
      jest.runAllTimers()
    })

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
    it(`renders ${label} as the selected option`, async () => {
      const { queryByText } = render(<SortButton orderBy={orderBy} onOrderByChange={() => {}} />)
      await act(async () => {
        jest.runAllTimers()
      })
      const selectedOption = queryByText(label)

      expect(selectedOption).toBeTruthy()
    })
  })
})
