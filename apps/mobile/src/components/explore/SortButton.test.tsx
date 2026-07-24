import { CustomRankingType, RankingType } from '@universe/api'
import React from 'react'
import { SortButton } from 'src/components/explore/SortButton'
import { act, render } from 'src/test/test-utils'
import { ExploreOrderBy } from 'wallet/src/features/wallet/types'

vi.mock('react-native-context-menu-view', async () => {
  // Use the actual implementation of `react-native-context-menu-view` as the mock implementation
  // (we use mock just to get the props of the component in test)
  const actual = await vi.importActual<{ default: React.ComponentType }>('react-native-context-menu-view')
  return { default: vi.fn().mockImplementation(actual.default as (...args: unknown[]) => unknown) }
})

describe('SortButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without error', async () => {
    const tree = render(<SortButton orderBy={RankingType.Volume} onOrderByChange={() => {}} />)

    await act(async () => {
      vi.runAllTimers()
    })

    expect(tree).toMatchSnapshot()
  })

  // i18n is key-echo mocked under vitest, so assertions target translation keys
  const cases: Array<{ test: string; orderBy: ExploreOrderBy; label: string }> = [
    { test: 'volume', orderBy: RankingType.Volume, label: 'explore.tokens.sort.label.volume' },
    {
      test: 'total value locked',
      orderBy: RankingType.TotalValueLocked,
      label: 'explore.tokens.sort.label.totalValueLocked',
    },
    { test: 'market cap', orderBy: RankingType.MarketCap, label: 'explore.tokens.sort.label.marketCap' },
    {
      test: 'price increase',
      orderBy: CustomRankingType.PricePercentChange1DayDesc,
      label: 'explore.tokens.sort.label.priceIncrease',
    },
    {
      test: 'price decrease',
      orderBy: CustomRankingType.PricePercentChange1DayAsc,
      label: 'explore.tokens.sort.label.priceDecrease',
    },
  ]

  describe.each(cases)('when ordering by $test', ({ orderBy, label }) => {
    it(`renders ${label} as the selected option`, async () => {
      const { queryByText } = render(<SortButton orderBy={orderBy} onOrderByChange={() => {}} />)
      await act(async () => {
        vi.runAllTimers()
      })
      const selectedOption = queryByText(label)

      expect(selectedOption).toBeTruthy()
    })
  })
})
