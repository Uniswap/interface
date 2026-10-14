import { AuctionOptionItemStats } from 'uniswap/src/components/lists/items/auctions/AuctionOptionItemStats'
import { render } from 'uniswap/src/test/test-utils'
import { ONE_HOUR_MS, ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

// The test i18n leaves keys unresolved, so translated labels assert on their keys.
describe('AuctionOptionItemStats', () => {
  const NOW_MS = new Date('2026-09-04T12:00:00Z').getTime()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW_MS)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders FDV over a live countdown', () => {
    const { getByText } = render(
      <AuctionOptionItemStats
        fdvUsd={1_234_567}
        endTimeMs={NOW_MS + 3 * ONE_HOUR_MS + 59 * ONE_MINUTE_MS + 22 * ONE_SECOND_MS}
      />,
    )

    expect(getByText('$1.2M')).toBeTruthy()
    expect(getByText('stats.fdv')).toBeTruthy()
    expect(getByText('search.results.auction.timeRemaining')).toBeTruthy()
  })

  it('renders FDV alone once the auction has ended', () => {
    const { getByText, queryByText } = render(
      <AuctionOptionItemStats fdvUsd={1_234_567} endTimeMs={NOW_MS - ONE_MINUTE_MS} />,
    )

    expect(getByText('$1.2M')).toBeTruthy()
    expect(queryByText('search.results.auction.timeRemaining')).toBeNull()
  })

  it('renders the countdown alone when FDV is unavailable', () => {
    const { getByText, queryByText } = render(
      <AuctionOptionItemStats fdvUsd={undefined} endTimeMs={NOW_MS + ONE_HOUR_MS} />,
    )

    expect(getByText('search.results.auction.timeRemaining')).toBeTruthy()
    expect(queryByText('stats.fdv')).toBeNull()
  })
})
