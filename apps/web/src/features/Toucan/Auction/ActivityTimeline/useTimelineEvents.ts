import { AuctionStep } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useMemo } from 'react'
import { AuctionDetails } from '~/features/Toucan/Auction/store/types'
import { blockToTimestamp } from '~/features/Toucan/Auction/utils/blockToTimestamp'

export type TimelineEventType =
  | 'pre-sale-starts'
  | 'pre-sale-ends'
  | 'auction-started'
  | 'general-sale-starts'
  | 'auction-ends'
  | 'tokens-claimable'
  | 'auction-failed'

export interface TimelineEventStrings {
  label: string
  description: string
  futureDescription: string
  badge?: string
  allowlistDescription?: string
  allowlistFutureDescription?: string
}

export interface TimelineEvent {
  type: TimelineEventType
  label: string
  description: string
  futureDescription: string
  block: number
  time: Date
  badge?: string
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

export function deriveTimelineEvents({
  auctionDetails,
  strings,
  auctionHasPresale = false,
  allowlistEndBlock,
  isAuctionFailed = false,
}: {
  auctionDetails: AuctionDetails
  strings: Record<TimelineEventType, TimelineEventStrings>
  auctionHasPresale?: boolean
  allowlistEndBlock?: number
  isAuctionFailed?: boolean
}): TimelineEvent[] {
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

  // Auction goes live and emits tokens at auctionStartBlock, but bidding stays
  // restricted to allowlisted wallets until allowlistEndBlock (general sale).
  const isAllowlistOnlyPhase =
    auctionHasPresale && allowlistEndBlock !== undefined && allowlistEndBlock > auctionStartBlock

  const auctionStartedStrings = strings['auction-started']
  events.push({
    type: 'auction-started',
    label: auctionStartedStrings.label,
    description:
      isAllowlistOnlyPhase && auctionStartedStrings.allowlistDescription
        ? auctionStartedStrings.allowlistDescription
        : auctionStartedStrings.description,
    futureDescription:
      isAllowlistOnlyPhase && auctionStartedStrings.allowlistFutureDescription
        ? auctionStartedStrings.allowlistFutureDescription
        : auctionStartedStrings.futureDescription,
    block: auctionStartBlock,
    time: toTimestamp(auctionStartBlock),
    badge: isAllowlistOnlyPhase ? auctionStartedStrings.badge : undefined,
  })

  if (isAllowlistOnlyPhase) {
    events.push({
      type: 'general-sale-starts',
      label: strings['general-sale-starts'].label,
      description: strings['general-sale-starts'].description,
      futureDescription: strings['general-sale-starts'].futureDescription,
      block: allowlistEndBlock,
      time: toTimestamp(allowlistEndBlock),
    })
  }

  const endBlock = Number(auctionDetails.endBlock)
  events.push({
    type: 'auction-ends',
    label: strings['auction-ends'].label,
    description: strings['auction-ends'].description,
    futureDescription: strings['auction-ends'].futureDescription,
    block: endBlock,
    time: toTimestamp(endBlock),
  })

  // When the auction ended without graduating, the claim/trade milestone is
  // replaced by a failure notice — no tokens are distributed, funds are withdrawable.
  const claimBlock = Number(auctionDetails.claimBlock)
  const finalEventType: TimelineEventType = isAuctionFailed ? 'auction-failed' : 'tokens-claimable'
  events.push({
    type: finalEventType,
    label: strings[finalEventType].label,
    description: strings[finalEventType].description,
    futureDescription: strings[finalEventType].futureDescription,
    block: claimBlock,
    time: toTimestamp(claimBlock),
  })

  return events
}

/**
 * Derives timeline events from auction details and parsedAuctionSteps.
 * Handles pre-sale detection, auction start/end, and token claim events.
 */
export function useTimelineEvents({
  auctionDetails,
  strings,
  auctionHasPresale = false,
  allowlistEndBlock,
  isAuctionFailed = false,
}: {
  auctionDetails: AuctionDetails | null
  strings: Record<TimelineEventType, TimelineEventStrings>
  auctionHasPresale?: boolean
  allowlistEndBlock?: number
  isAuctionFailed?: boolean
}): TimelineEvent[] {
  return useMemo(() => {
    if (!auctionDetails) {
      return []
    }
    return deriveTimelineEvents({ auctionDetails, strings, auctionHasPresale, allowlistEndBlock, isAuctionFailed })
  }, [auctionDetails, strings, auctionHasPresale, allowlistEndBlock, isAuctionFailed])
}
