import { type PartialMessage, toPlainMessage } from '@bufbuild/protobuf'
import { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import type { Block } from '~/chains'
import { getAuctionTimeRemaining } from '~/features/Toucan/hooks/useTopAuctions/utils/getAuctionTimeRemaining'

const CREATED_AT_SECONDS = 1_700_000_000n
const NOW_MS = 10_000_000

function auction(overrides: PartialMessage<Auction> = {}) {
  return toPlainMessage(
    new Auction({
      chainId: UniverseChainId.Mainnet,
      creationBlock: '900',
      createdAt: new Date(Number(CREATED_AT_SECONDS) * 1000).toISOString(),
      startBlock: '1000',
      endBlock: '2000',
      ...overrides,
    }),
  )
}

function liveBlock(number: bigint, timestamp: bigint): Block {
  return { number, timestamp } as Block
}

describe(getAuctionTimeRemaining, () => {
  it('uses the served start and end times and completes once the live block reaches the end block', () => {
    const served = auction({
      estimatedStartTime: { seconds: 1_000n, nanos: 0 },
      estimatedEndTime: { seconds: 5_000n, nanos: 0 },
    })

    const live = getAuctionTimeRemaining({ auction: served, liveBlock: liveBlock(1_500n, 0n), currentTimeMs: NOW_MS })
    const ended = getAuctionTimeRemaining({ auction: served, liveBlock: liveBlock(2_000n, 0n), currentTimeMs: NOW_MS })

    expect(live).toEqual({
      isCompleted: false,
      startBlockTimestamp: 1_000n,
      endBlockTimestamp: 5_000n,
      preBidEndBlockTimestamp: 1_000n,
    })
    expect(ended.isCompleted).toBe(true)
  })

  it('estimates from the creation anchor at the live-calibrated rate when the times are not served', () => {
    // 1000 blocks in 100_000s since creation: 100s/block, not Mainnet's 12s constant.
    const live = liveBlock(1_900n, CREATED_AT_SECONDS + 100_000n)

    const { startBlockTimestamp, endBlockTimestamp } = getAuctionTimeRemaining({
      auction: auction(),
      liveBlock: live,
      currentTimeMs: NOW_MS,
    })

    expect(startBlockTimestamp).toBe(CREATED_AT_SECONDS + 100n * 100n)
    expect(endBlockTimestamp).toBe(CREATED_AT_SECONDS + 1_100n * 100n)
  })

  it('interpolates the pre-bid boundary between start and end', () => {
    const withPreBid = auction({
      estimatedStartTime: { seconds: 1_000n, nanos: 0 },
      estimatedEndTime: { seconds: 5_000n, nanos: 0 },
      parsedAuctionSteps: [
        { mps: 0, startBlock: '1000', endBlock: '1250' },
        { mps: 10, startBlock: '1250', endBlock: '2000' },
      ],
    })

    const { preBidEndBlockTimestamp } = getAuctionTimeRemaining({
      auction: withPreBid,
      liveBlock: undefined,
      currentTimeMs: NOW_MS,
    })

    expect(preBidEndBlockTimestamp).toBe(2_000n)
  })

  it('completes without a live block from a served graduation or an end time that has passed', () => {
    const ended = auction({ estimatedEndTime: { seconds: 5_000n, nanos: 0 } })
    const graduated = auction({ isGraduated: true })

    const atEnd = getAuctionTimeRemaining({ auction: ended, liveBlock: undefined, currentTimeMs: 5_000_000 })
    const beforeEnd = getAuctionTimeRemaining({ auction: ended, liveBlock: undefined, currentTimeMs: 4_999_000 })
    const graduatedNow = getAuctionTimeRemaining({ auction: graduated, liveBlock: undefined, currentTimeMs: 0 })

    expect(atEnd.isCompleted).toBe(true)
    expect(beforeEnd.isCompleted).toBe(false)
    expect(graduatedNow.isCompleted).toBe(true)
  })

  it('has no times for a missing auction', () => {
    const missing = getAuctionTimeRemaining({ auction: undefined, liveBlock: liveBlock(1n, 0n), currentTimeMs: NOW_MS })

    expect(missing).toEqual({
      isCompleted: false,
      startBlockTimestamp: undefined,
      endBlockTimestamp: undefined,
      preBidEndBlockTimestamp: undefined,
    })
  })
})
