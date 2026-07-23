import { AuctionStep } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import {
  deriveTimelineEvents,
  getActiveEventIndex,
  TimelineEvent,
  TimelineEventStrings,
  TimelineEventType,
} from '~/features/Toucan/Auction/ActivityTimeline/useTimelineEvents'
import { AuctionDetails } from '~/features/Toucan/Auction/store/types'

const strings: Record<TimelineEventType, TimelineEventStrings> = {
  'pre-sale-starts': {
    label: 'Pre-sale starts',
    description: 'Pre-sale period begins',
    futureDescription: 'Pre-sale period will begin',
  },
  'pre-sale-ends': {
    label: 'Pre-sale ends',
    description: 'Pre-sale period ends',
    futureDescription: 'Pre-sale period will end',
  },
  'auction-started': {
    label: 'Auction started',
    description: 'Auction begins',
    futureDescription: 'Auction will begin',
  },
  'general-sale-starts': {
    label: 'General sale starts',
    description: 'General sale begins',
    futureDescription: 'General sale will begin',
  },
  'auction-ends': { label: 'Auction ends', description: 'Auction ends', futureDescription: 'Auction will end' },
  'tokens-claimable': {
    label: 'Tokens claimable',
    description: 'Tokens become claimable',
    futureDescription: 'Tokens will become claimable',
  },
  'auction-failed': {
    label: 'Auction failed to launch.',
    description: 'This auction did not raise the required amount (3.333M USDC) and no tokens will be distributed.',
    futureDescription:
      'This auction did not raise the required amount (3.333M USDC) and no tokens will be distributed.',
  },
}

function makeStep(mps: number, startBlock: string): AuctionStep {
  return { mps, startBlock } as unknown as AuctionStep
}

function makeAuctionDetails(overrides: Partial<AuctionDetails> = {}): AuctionDetails {
  return {
    creationBlock: '100',
    createdAt: '2025-01-01T00:00:00Z',
    chainId: 1,
    endBlock: '500',
    claimBlock: '600',
    parsedAuctionSteps: [],
    ...overrides,
  } as unknown as AuctionDetails
}

describe('getActiveEventIndex', () => {
  const events: TimelineEvent[] = [
    { type: 'auction-started', label: '', description: '', futureDescription: '', block: 100, time: new Date() },
    { type: 'auction-ends', label: '', description: '', futureDescription: '', block: 200, time: new Date() },
    { type: 'tokens-claimable', label: '', description: '', futureDescription: '', block: 300, time: new Date() },
  ]

  it('returns -1 when currentBlockNumber is undefined', () => {
    expect(getActiveEventIndex(events, undefined)).toBe(-1)
  })

  it('returns -1 when events array is empty', () => {
    expect(getActiveEventIndex([], 150)).toBe(-1)
  })

  it('returns -1 when current block is before all events', () => {
    expect(getActiveEventIndex(events, 50)).toBe(-1)
  })

  it('returns first event index when current block equals first event block', () => {
    expect(getActiveEventIndex(events, 100)).toBe(0)
  })

  it('returns first event index when current block is between first and second', () => {
    expect(getActiveEventIndex(events, 150)).toBe(0)
  })

  it('returns second event index when current block equals second event block', () => {
    expect(getActiveEventIndex(events, 200)).toBe(1)
  })

  it('returns last event index when current block is past all events', () => {
    expect(getActiveEventIndex(events, 999)).toBe(2)
  })

  it('returns last event index when current block equals last event block', () => {
    expect(getActiveEventIndex(events, 300)).toBe(2)
  })
})

describe('deriveTimelineEvents', () => {
  it('returns empty array when there are no steps', () => {
    const details = makeAuctionDetails({ parsedAuctionSteps: [] })
    expect(deriveTimelineEvents({ auctionDetails: details, strings })).toEqual([])
  })

  it('derives auction-started, auction-ends, and tokens-claimable without pre-sale', () => {
    const details = makeAuctionDetails({
      parsedAuctionSteps: [makeStep(10, '200')],
      endBlock: '500',
      claimBlock: '600',
    })

    const events = deriveTimelineEvents({ auctionDetails: details, strings })

    expect(events).toHaveLength(3)
    expect(events.map((e) => e.type)).toEqual(['auction-started', 'auction-ends', 'tokens-claimable'])
    expect(events[0].block).toBe(200)
    expect(events[1].block).toBe(500)
    expect(events[2].block).toBe(600)
  })

  it('includes pre-sale events when leading steps have mps=0', () => {
    const details = makeAuctionDetails({
      parsedAuctionSteps: [
        makeStep(0, '150'), // pre-sale step
        makeStep(10, '200'), // first release step
      ],
      endBlock: '500',
      claimBlock: '600',
    })

    const events = deriveTimelineEvents({ auctionDetails: details, strings })

    expect(events).toHaveLength(5)
    expect(events.map((e) => e.type)).toEqual([
      'pre-sale-starts',
      'pre-sale-ends',
      'auction-started',
      'auction-ends',
      'tokens-claimable',
    ])
    expect(events[0].block).toBe(150)
    expect(events[1].block).toBe(200)
    expect(events[2].block).toBe(200) // auction starts where pre-sale ends
  })

  it('does not treat a single mps=0 step as pre-sale when there are no release steps', () => {
    const details = makeAuctionDetails({
      parsedAuctionSteps: [makeStep(0, '150')],
      endBlock: '500',
      claimBlock: '600',
    })

    const events = deriveTimelineEvents({ auctionDetails: details, strings })

    // No pre-sale because firstReleaseStepIndex would be -1 (no mps > 0)
    expect(events).toHaveLength(3)
    expect(events[0].type).toBe('auction-started')
    expect(events[0].block).toBe(150)
  })

  it('uses correct labels and descriptions from strings', () => {
    const details = makeAuctionDetails({
      parsedAuctionSteps: [makeStep(10, '200')],
    })

    const events = deriveTimelineEvents({ auctionDetails: details, strings })

    expect(events[0].label).toBe('Auction started')
    expect(events[0].description).toBe('Auction begins')
    expect(events[1].label).toBe('Auction ends')
    expect(events[2].label).toBe('Tokens claimable')
  })

  it('computes time from blockToTimestamp', () => {
    const details = makeAuctionDetails({
      creationBlock: '100',
      createdAt: '2025-01-01T00:00:00Z',
      parsedAuctionSteps: [makeStep(10, '200')],
    })

    const events = deriveTimelineEvents({ auctionDetails: details, strings })

    expect(events[0].time.getTime()).toBe(1735690800000)
    expect(events[1].time.getTime()).toBe(1735694400000)
    expect(events[2].time.getTime()).toBe(1735695600000)
  })

  it('replaces the tokens-claimable event with auction-failed when the auction failed to graduate', () => {
    const details = makeAuctionDetails({
      parsedAuctionSteps: [makeStep(10, '200')],
      endBlock: '500',
      claimBlock: '600',
    })

    const events = deriveTimelineEvents({ auctionDetails: details, strings, isAuctionFailed: true })

    expect(events.map((e) => e.type)).toEqual(['auction-started', 'auction-ends', 'auction-failed'])
    const failedEvent = events[events.length - 1]
    expect(failedEvent.block).toBe(600)
    expect(failedEvent.label).toBe('Auction failed to launch.')
    expect(failedEvent.description).toContain('3.333M USDC')
  })

  it('keeps the tokens-claimable event when the auction has not failed', () => {
    const details = makeAuctionDetails({
      parsedAuctionSteps: [makeStep(10, '200')],
      endBlock: '500',
      claimBlock: '600',
    })

    const events = deriveTimelineEvents({ auctionDetails: details, strings, isAuctionFailed: false })

    expect(events[events.length - 1].type).toBe('tokens-claimable')
  })

  it('handles multiple contiguous pre-sale steps', () => {
    const details = makeAuctionDetails({
      parsedAuctionSteps: [
        makeStep(0, '100'), // pre-sale step 1
        makeStep(0, '150'), // pre-sale step 2
        makeStep(10, '200'), // first release step
      ],
      endBlock: '500',
      claimBlock: '600',
    })

    const events = deriveTimelineEvents({ auctionDetails: details, strings })

    expect(events).toHaveLength(5)
    expect(events[0].type).toBe('pre-sale-starts')
    expect(events[0].block).toBe(100)
    expect(events[1].type).toBe('pre-sale-ends')
    expect(events[1].block).toBe(200) // ends at the first release step
  })
})
