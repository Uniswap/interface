import { matchesAuctionStatus } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/utils/filterAuctions'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import { AuctionStatus } from '~/types/auctionFilters'

const NOW_MS = 1_000_000_000_000
const NOW_SECONDS = BigInt(NOW_MS / 1000)
const ONE_TOKEN = (10n ** 18n).toString()

function createEnrichedAuction({
  isCompleted = false,
  isComingSoon = false,
  totalBidVolume,
  isGraduated,
}: {
  isCompleted?: boolean
  isComingSoon?: boolean
  totalBidVolume?: string
  isGraduated?: boolean
}): EnrichedAuction {
  return {
    auction: {
      totalBidVolume,
      isGraduated,
      requiredCurrencyRaised: ONE_TOKEN,
      currencyTokenDecimals: 18,
    },
    verified: false,
    logoUrl: undefined,
    timeRemaining: {
      isCompleted,
      startBlockTimestamp: isComingSoon ? NOW_SECONDS + 3600n : NOW_SECONDS - 3600n,
      endBlockTimestamp: undefined,
    },
  } as unknown as EnrichedAuction
}

describe(matchesAuctionStatus, () => {
  it.each([
    { name: 'live', auction: createEnrichedAuction({}), expected: AuctionStatus.Active },
    { name: 'upcoming', auction: createEnrichedAuction({ isComingSoon: true }), expected: AuctionStatus.Upcoming },
    {
      name: 'ended at its threshold with no verdict yet',
      auction: createEnrichedAuction({ isCompleted: true, totalBidVolume: ONE_TOKEN }),
      expected: AuctionStatus.Launched,
    },
    {
      name: 'ended below its threshold',
      auction: createEnrichedAuction({ isCompleted: true, totalBidVolume: '0' }),
      expected: AuctionStatus.Failed,
    },
    {
      name: 'graduated by contract verdict',
      auction: createEnrichedAuction({ isCompleted: true, totalBidVolume: '0', isGraduated: true }),
      expected: AuctionStatus.Launched,
    },
    {
      name: 'failed by contract verdict',
      auction: createEnrichedAuction({ isCompleted: true, totalBidVolume: ONE_TOKEN, isGraduated: false }),
      expected: AuctionStatus.Failed,
    },
  ])('puts a $name auction under $expected and All only', ({ auction, expected }) => {
    const matched = Object.values(AuctionStatus).filter((status) =>
      matchesAuctionStatus({ auction, status, currentTimeMs: NOW_MS }),
    )
    expect(matched).toEqual([AuctionStatus.All, expected])
  })
})
