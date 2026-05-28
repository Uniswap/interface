import { AuctionStep } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { AuctionDetails } from '~/features/Toucan/Auction/store/types'
import { blockToTimestamp } from '~/features/Toucan/Auction/utils/blockToTimestamp'

export type TimelineEventType =
  | 'pre-sale-starts'
  | 'pre-sale-ends'
  | 'auction-started'
  | 'auction-ends'
  | 'tokens-claimable'

export interface TimelineEventStrings {
  label: string
  description: string
  futureDescription: string
}

export interface TimelineEvent {
  type: TimelineEventType
  label: string
  description: string
  futureDescription: string
  block: number
  time: Date
}

/**
 * Returns the index of the currently active event — the most recent event
 * whose block has already been reached.
 */
export function getActiveEventIndex(events: TimelineEvent[], currentBlockNumber: number | undefined): number {
  if (!currentBlockNumber || events.length === 0) {
    return -1
  }

  for (let i = events.length - 1; i >= 0; i--) {
    if (currentBlockNumber >= events[i].block) {
      return i
    }
  }

  return -1
}

export function deriveTimelineEvents(
  auctionDetails: AuctionDetails,
  strings: Record<TimelineEventType, TimelineEventStrings>,
): TimelineEvent[] {
  const steps: AuctionStep[] = auctionDetails.parsedAuctionSteps
  const anchorBlock = Number(auctionDetails.creationBlock)
  const anchorTime = new Date(auctionDetails.createdAt)
  const chainId = auctionDetails.chainId

  const toTimestamp = (block: number): Date => blockToTimestamp({ block, anchorBlock, anchorTime, chainId })

  const events: TimelineEvent[] = []

  if (steps.length === 0) {
    return events
  }

  // Contiguous mps=0 steps at the start form the pre-sale period
  const firstReleaseStepIndex = steps.findIndex((s) => s.mps > 0)
  const firstStep = steps[0]
  const hasPrebid = firstStep.mps === 0 && firstReleaseStepIndex > 0

  if (hasPrebid) {
    const preSaleStartBlock = Number(firstStep.startBlock)
    const preSaleEndBlock = Number(steps[firstReleaseStepIndex].startBlock)

    events.push({
      type: 'pre-sale-starts',
      label: strings['pre-sale-starts'].label,
      description: strings['pre-sale-starts'].description,
      futureDescription: strings['pre-sale-starts'].futureDescription,
      block: preSaleStartBlock,
      time: toTimestamp(preSaleStartBlock),
    })

    events.push({
      type: 'pre-sale-ends',
      label: strings['pre-sale-ends'].label,
      description: strings['pre-sale-ends'].description,
      futureDescription: strings['pre-sale-ends'].futureDescription,
      block: preSaleEndBlock,
      time: toTimestamp(preSaleEndBlock),
    })
  }

  const auctionStartBlock = hasPrebid ? Number(steps[firstReleaseStepIndex].startBlock) : Number(firstStep.startBlock)

  events.push({
    type: 'auction-started',
    label: strings['auction-started'].label,
    description: strings['auction-started'].description,
    futureDescription: strings['auction-started'].futureDescription,
    block: auctionStartBlock,
    time: toTimestamp(auctionStartBlock),
  })

  const endBlock = Number(auctionDetails.endBlock)
  events.push({
    type: 'auction-ends',
    label: strings['auction-ends'].label,
    description: strings['auction-ends'].description,
    futureDescription: strings['auction-ends'].futureDescription,
    block: endBlock,
    time: toTimestamp(endBlock),
  })

  const claimBlock = Number(auctionDetails.claimBlock)
  events.push({
    type: 'tokens-claimable',
    label: strings['tokens-claimable'].label,
    description: strings['tokens-claimable'].description,
    futureDescription: strings['tokens-claimable'].futureDescription,
    block: claimBlock,
    time: toTimestamp(claimBlock),
  })

  return events
}

/**
 * Derives timeline events from auction details and parsedAuctionSteps.
 * Handles pre-sale detection, auction start/end, and token claim events.
 */
export function useTimelineEvents(
  auctionDetails: AuctionDetails | null,
  strings: Record<TimelineEventType, TimelineEventStrings>,
): TimelineEvent[] {
  return useMemo(() => {
    if (!auctionDetails) {
      return []
    }
    return deriveTimelineEvents(auctionDetails, strings)
  }, [auctionDetails, strings])
}
