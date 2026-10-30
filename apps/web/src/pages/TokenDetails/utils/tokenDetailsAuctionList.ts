import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { areEvmAddressesEqual } from '@universe/chains'
import { timestampToMs } from 'uniswap/src/data/apiClients/dataApiService/utils/protoTimestamp'
import { AuctionTimePhase, getAuctionTimePhase } from 'uniswap/src/features/toucan/auctionTimePhase'

const PHASE_ORDER: Record<AuctionTimePhase, number> = {
  [AuctionTimePhase.Live]: 0,
  [AuctionTimePhase.Upcoming]: 1,
  // A missing end-time estimate is a transient block-time lookup failure, so a possibly live auction outranks a finished one.
  [AuctionTimePhase.Unknown]: 2,
  [AuctionTimePhase.Ended]: 3,
}

function getAuctionListPhase({ auction, nowMs }: { auction: PlainMessage<Auction>; nowMs: number }): AuctionTimePhase {
  return getAuctionTimePhase({
    startTimeMs: timestampToMs(auction.estimatedStartTime),
    endTimeMs: timestampToMs(auction.estimatedEndTime),
    nowMs,
  }).phase
}

/** Live auctions ending soonest first, then upcoming by start, then unknown, then ended most recent first. */
export function sortTokenDetailsAuctions({
  auctions,
  nowMs,
}: {
  auctions: PlainMessage<Auction>[]
  nowMs: number
}): PlainMessage<Auction>[] {
  const sortKey = (auction: PlainMessage<Auction>): number => {
    const phase = getAuctionListPhase({ auction, nowMs })
    const startMs = timestampToMs(auction.estimatedStartTime) ?? 0
    const endMs = timestampToMs(auction.estimatedEndTime) ?? 0
    if (phase === AuctionTimePhase.Live) {
      return endMs
    }
    if (phase === AuctionTimePhase.Upcoming) {
      return startMs
    }
    return phase === AuctionTimePhase.Ended ? -endMs : 0
  }
  return auctions
    .map((auction) => ({ auction, phase: PHASE_ORDER[getAuctionListPhase({ auction, nowMs })], key: sortKey(auction) }))
    .sort((a, b) => a.phase - b.phase || a.key - b.key)
    .map(({ auction }) => auction)
}

export function countOtherActiveAuctions({
  auctions,
  primaryAuctionAddress,
  nowMs,
}: {
  auctions: PlainMessage<Auction>[]
  primaryAuctionAddress: string | undefined
  nowMs: number
}): number {
  return auctions.filter((auction) => {
    if (primaryAuctionAddress && areEvmAddressesEqual(auction.address, primaryAuctionAddress)) {
      return false
    }
    const phase = getAuctionListPhase({ auction, nowMs })
    return phase === AuctionTimePhase.Live || phase === AuctionTimePhase.Upcoming
  }).length
}
