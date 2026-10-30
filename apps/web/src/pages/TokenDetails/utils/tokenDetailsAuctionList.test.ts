import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { countOtherActiveAuctions, sortTokenDetailsAuctions } from '~/pages/TokenDetails/utils/tokenDetailsAuctionList'

const NOW_SECONDS = 1_000_000
const NOW = NOW_SECONDS * 1000

function ts(seconds: number): { seconds: bigint; nanos: number } {
  return { seconds: BigInt(seconds), nanos: 0 }
}

function auction({
  auctionId,
  address,
  start,
  end,
}: {
  auctionId: string
  address: string
  start?: number
  end?: number
}): PlainMessage<Auction> {
  return {
    auctionId,
    address,
    estimatedStartTime: start === undefined ? undefined : ts(start),
    estimatedEndTime: end === undefined ? undefined : ts(end),
  } as PlainMessage<Auction>
}

const live = auction({
  auctionId: 'live',
  address: '0x00000000000000000000000000000000000000a1',
  start: NOW_SECONDS - 100,
  end: NOW_SECONDS + 5_000,
})
const liveSooner = auction({
  auctionId: 'liveSooner',
  address: '0x00000000000000000000000000000000000000a2',
  start: NOW_SECONDS - 100,
  end: NOW_SECONDS + 1_000,
})
const upcomingLater = auction({
  auctionId: 'upcomingLater',
  address: '0x00000000000000000000000000000000000000a3',
  start: NOW_SECONDS + 9_000,
  end: NOW_SECONDS + 10_000,
})
const upcomingSoon = auction({
  auctionId: 'upcomingSoon',
  address: '0x00000000000000000000000000000000000000a4',
  start: NOW_SECONDS + 500,
  end: NOW_SECONDS + 10_000,
})
const endedOld = auction({
  auctionId: 'endedOld',
  address: '0x00000000000000000000000000000000000000a5',
  start: NOW_SECONDS - 9_000,
  end: NOW_SECONDS - 8_000,
})
const endedRecent = auction({
  auctionId: 'endedRecent',
  address: '0x00000000000000000000000000000000000000a6',
  start: NOW_SECONDS - 2_000,
  end: NOW_SECONDS - 100,
})
const upcomingNoEnd = auction({
  auctionId: 'upcomingNoEnd',
  address: '0x00000000000000000000000000000000000000a8',
  start: NOW_SECONDS + 1_000,
})
const endedNoStart = auction({
  auctionId: 'endedNoStart',
  address: '0x00000000000000000000000000000000000000a9',
  end: NOW_SECONDS - 5_000,
})
const unknown = auction({
  auctionId: 'unknown',
  address: '0x00000000000000000000000000000000000000a7',
  start: NOW_SECONDS - 100,
})

describe('sortTokenDetailsAuctions', () => {
  it('orders live by time left, then upcoming by start, then unknown, then ended most recent first', () => {
    const sorted = sortTokenDetailsAuctions({
      auctions: [
        unknown,
        endedOld,
        upcomingLater,
        endedNoStart,
        live,
        endedRecent,
        upcomingNoEnd,
        upcomingSoon,
        liveSooner,
      ],
      nowMs: NOW,
    })
    expect(sorted.map((a) => a.auctionId)).toEqual([
      'liveSooner',
      'live',
      'upcomingSoon',
      'upcomingNoEnd',
      'upcomingLater',
      'unknown',
      'endedRecent',
      'endedNoStart',
      'endedOld',
    ])
  })
})

describe('countOtherActiveAuctions', () => {
  it('counts live and upcoming auctions other than the primary one', () => {
    expect(
      countOtherActiveAuctions({
        auctions: [live, upcomingSoon, upcomingNoEnd, endedRecent, endedNoStart, unknown],
        primaryAuctionAddress: live.address,
        nowMs: NOW,
      }),
    ).toBe(2)
  })

  it('counts every active auction when there is no primary', () => {
    expect(
      countOtherActiveAuctions({ auctions: [live, upcomingSoon], primaryAuctionAddress: undefined, nowMs: NOW }),
    ).toBe(2)
  })

  it('excludes the primary by case-insensitive address when auction IDs are absent', () => {
    expect(
      countOtherActiveAuctions({
        auctions: [live, upcomingSoon].map((entry) => ({ ...entry, auctionId: '' })),
        primaryAuctionAddress: live.address.toUpperCase(),
        nowMs: NOW,
      }),
    ).toBe(1)
  })
})
