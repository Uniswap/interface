import type { PlainMessage, Timestamp } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { timestampToSeconds } from 'utilities/src/time/protoTimestamp'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import type { Block } from '~/chains'
import { computePreBidEndBlock } from '~/features/Toucan/Auction/utils/emissionStartBlock'
import { parseCreatedAt } from '~/features/Toucan/Auction/utils/parseCreatedAt'
import { isAuctionCompleted } from '~/features/Toucan/hooks/useTopAuctions/utils/isAuctionCompleted'
import { calibratedBlockToTimestamp } from '~/utils/blockToTimestamp'

export interface AuctionTimeRemaining {
  isCompleted: boolean
  startBlockTimestamp: bigint | undefined
  endBlockTimestamp: bigint | undefined
  preBidEndBlockTimestamp: bigint | undefined
}

function estimateBlockTimestamp({
  auction,
  liveBlock,
  blockNumber,
}: {
  auction: PlainMessage<Auction>
  liveBlock: Block | undefined
  blockNumber: string
}): bigint | undefined {
  const { timestampMs: createdAtMs } = parseCreatedAt(auction.createdAt)
  if (createdAtMs === undefined || !auction.creationBlock) {
    return undefined
  }
  const estimated = calibratedBlockToTimestamp({
    block: Number(blockNumber),
    anchorBlock: Number(auction.creationBlock),
    anchorTime: new Date(createdAtMs),
    chainId: auction.chainId,
    currentBlock: liveBlock ? Number(liveBlock.number) : undefined,
    currentTime: liveBlock ? new Date(Number(liveBlock.timestamp) * ONE_SECOND_MS) : undefined,
  })
  return BigInt(Math.floor(estimated.getTime() / ONE_SECOND_MS))
}

function interpolateBlockTimestamp({
  auction,
  blockNumber,
  startBlockTimestamp,
  endBlockTimestamp,
}: {
  auction: PlainMessage<Auction>
  blockNumber: string
  startBlockTimestamp: bigint | undefined
  endBlockTimestamp: bigint | undefined
}): bigint | undefined {
  if (
    startBlockTimestamp === undefined ||
    endBlockTimestamp === undefined ||
    !auction.startBlock ||
    !auction.endBlock
  ) {
    return undefined
  }
  const startBlock = BigInt(auction.startBlock)
  const blockSpan = BigInt(auction.endBlock) - startBlock
  if (blockSpan <= 0n) {
    return startBlockTimestamp
  }
  return (
    startBlockTimestamp + ((endBlockTimestamp - startBlockTimestamp) * (BigInt(blockNumber) - startBlock)) / blockSpan
  )
}

/**
 * ListTopAuctions omits `estimatedStartTime`/`estimatedEndTime` on graduated rows, which fall back to a
 * block estimate anchored on the auction's creation. `isCompleted` is live block ≥ end block; with no live
 * block (RPC failed) it falls back to a served graduation or a passed end time.
 */
export function getAuctionTimeRemaining({
  auction,
  liveBlock,
  currentTimeMs,
}: {
  auction: PlainMessage<Auction> | undefined
  liveBlock: Block | undefined
  currentTimeMs: number
}): AuctionTimeRemaining {
  if (!auction) {
    return {
      isCompleted: false,
      startBlockTimestamp: undefined,
      endBlockTimestamp: undefined,
      preBidEndBlockTimestamp: undefined,
    }
  }

  const blockTimestamp = (blockNumber: string, served: PlainMessage<Timestamp> | undefined): bigint | undefined =>
    timestampToSeconds(served) ?? estimateBlockTimestamp({ auction, liveBlock, blockNumber })

  const startBlockTimestamp = auction.startBlock
    ? blockTimestamp(auction.startBlock, auction.estimatedStartTime)
    : undefined
  const endBlockTimestamp = auction.endBlock ? blockTimestamp(auction.endBlock, auction.estimatedEndTime) : undefined
  const preBidEndBlock = computePreBidEndBlock(auction.parsedAuctionSteps, auction.startBlock)
  const isCompleted = liveBlock
    ? isAuctionCompleted({ endBlock: auction.endBlock, blockNumber: liveBlock.number })
    : auction.isGraduated === true ||
      (endBlockTimestamp !== undefined && endBlockTimestamp <= BigInt(Math.floor(currentTimeMs / ONE_SECOND_MS)))

  return {
    isCompleted,
    startBlockTimestamp,
    endBlockTimestamp,
    preBidEndBlockTimestamp:
      preBidEndBlock && preBidEndBlock !== auction.startBlock
        ? interpolateBlockTimestamp({ auction, blockNumber: preBidEndBlock, startBlockTimestamp, endBlockTimestamp })
        : startBlockTimestamp,
  }
}
