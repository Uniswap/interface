import { AuctionOptionItemStats } from 'uniswap/src/components/lists/items/auctions/AuctionOptionItemStats'
import { act, render } from 'uniswap/src/test/test-utils'
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

  it('renders committed volume over a live countdown', () => {
    const { getByText } = render(
      <AuctionOptionItemStats
        committedVolumeUsd={1_234_567}
        startTimeMs={NOW_MS - ONE_HOUR_MS}
        endTimeMs={NOW_MS + 3 * ONE_HOUR_MS + 59 * ONE_MINUTE_MS + 22 * ONE_SECOND_MS}
      />,
    )

    expect(getByText('$1.2M')).toBeTruthy()
    expect(getByText('search.results.stats.committed')).toBeTruthy()
    expect(getByText('search.results.auction.timeRemaining')).toBeTruthy()
  })

  it('shows starting soon over a countdown to the start before the auction opens', () => {
    const { getByText, queryByText } = render(
      <AuctionOptionItemStats
        committedVolumeUsd={0}
        startTimeMs={NOW_MS + ONE_HOUR_MS}
        endTimeMs={NOW_MS + 2 * ONE_HOUR_MS}
      />,
    )

    expect(getByText('toucan.auction.status.startingSoon')).toBeTruthy()
    expect(getByText('search.results.auction.startsIn')).toBeTruthy()
    expect(queryByText('search.results.stats.committed')).toBeNull()
    expect(queryByText('search.results.auction.timeRemaining')).toBeNull()
  })

  it('crosses from upcoming to live to ended without new props', async () => {
    const { getByText } = render(
      <AuctionOptionItemStats
        committedVolumeUsd={1_234_567}
        startTimeMs={NOW_MS + ONE_SECOND_MS}
        endTimeMs={NOW_MS + 2 * ONE_SECOND_MS}
      />,
    )
    expect(getByText('search.results.auction.startsIn')).toBeTruthy()
    expect(getByText('toucan.auction.status.startingSoon')).toBeTruthy()

    await act(() => vi.advanceTimersByTime(ONE_SECOND_MS))
    expect(getByText('search.results.auction.timeRemaining')).toBeTruthy()
    expect(getByText('search.results.stats.committed')).toBeTruthy()

    await act(() => vi.advanceTimersByTime(ONE_SECOND_MS))
    expect(getByText('common.ended')).toBeTruthy()
  })

  it('renders committed volume over an ended label once the auction has ended', () => {
    const { getByText, queryByText } = render(
      <AuctionOptionItemStats committedVolumeUsd={1_234_567} endTimeMs={NOW_MS - ONE_MINUTE_MS} />,
    )

    expect(getByText('$1.2M')).toBeTruthy()
    expect(getByText('common.ended')).toBeTruthy()
    expect(queryByText('search.results.auction.timeRemaining')).toBeNull()
  })

  it('renders zero committed volume as $0, not the missing-data dash', () => {
    const { getByText, queryByText } = render(<AuctionOptionItemStats committedVolumeUsd={0} isEnded />)

    expect(getByText('$0')).toBeTruthy()
    expect(queryByText('-')).toBeNull()
  })

  it('leaves the phase line empty when the start is unknown and the end is ahead', () => {
    const { queryByText } = render(
      <AuctionOptionItemStats committedVolumeUsd={1_234_567} endTimeMs={NOW_MS + ONE_HOUR_MS} />,
    )

    expect(queryByText('search.results.auction.timeRemaining')).toBeNull()
    expect(queryByText('common.ended')).toBeNull()
  })

  it.each([
    ['no times', {}],
    ['only an end estimate', { endTimeMs: NOW_MS + ONE_HOUR_MS }],
  ])('shows starting soon for a backend-upcoming auction with %s', (_, times) => {
    const { getByText, queryByText } = render(<AuctionOptionItemStats committedVolumeUsd={0} isUpcoming {...times} />)

    expect(getByText('toucan.auction.status.startingSoon')).toBeTruthy()
    expect(queryByText('search.results.stats.committed')).toBeNull()
  })

  it('says ended when the backend reports it, even without an end time', () => {
    const { getByText } = render(<AuctionOptionItemStats committedVolumeUsd={1_234_567} isEnded />)

    expect(getByText('common.ended')).toBeTruthy()
  })

  it('says ended when the backend reports it, even while the end estimate is ahead', () => {
    const { getByText, queryByText } = render(
      <AuctionOptionItemStats committedVolumeUsd={1_234_567} endTimeMs={NOW_MS + ONE_HOUR_MS} isEnded />,
    )

    expect(getByText('common.ended')).toBeTruthy()
    expect(queryByText('search.results.auction.timeRemaining')).toBeNull()
  })

  it('renders the countdown alone when committed volume is unavailable', () => {
    const { getByText, queryByText } = render(
      <AuctionOptionItemStats
        committedVolumeUsd={undefined}
        startTimeMs={NOW_MS - ONE_HOUR_MS}
        endTimeMs={NOW_MS + ONE_HOUR_MS}
      />,
    )

    expect(getByText('search.results.auction.timeRemaining')).toBeTruthy()
    expect(queryByText('search.results.stats.committed')).toBeNull()
  })
})
