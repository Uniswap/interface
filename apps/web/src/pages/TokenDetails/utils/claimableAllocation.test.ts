import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction, Bid } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { describe, expect, it } from 'vitest'
import {
  type ClaimableAllocation,
  type ClaimableAllocationDataSources,
  ClaimableAllocationState,
  hasClaimCardContent,
  resolveClaimableAllocation,
} from '~/pages/TokenDetails/utils/claimableAllocation'

const AUCTION = {
  startBlock: '100',
  endBlock: '200',
  claimBlock: '250',
  requiredCurrencyRaised: '1000',
} as PlainMessage<Auction>

const ENDED_GRADUATED: ClaimableAllocationDataSources = {
  currentBlock: { status: 'success', blockNumber: 300n },
  currencyRaised: { status: 'success', currencyRaised: '1000' },
  pools: { status: 'success', poolCount: 1 },
}

function bid(overrides: Partial<PlainMessage<Bid>> = {}): PlainMessage<Bid> {
  return {
    bidId: 'bid-1',
    auctionId: 'auction-1',
    walletId: '0x1111111111111111111111111111111111111111',
    txHash: '0xabc',
    amount: '1000',
    maxPrice: '1',
    createdAt: '2026-07-01T00:00:00Z',
    status: 'submitted',
    baseTokenInitial: '1000',
    currencySpent: '500',
    ...overrides,
  }
}

function resolve(overrides: Partial<Parameters<typeof resolveClaimableAllocation>[0]> = {}): ClaimableAllocation {
  return resolveClaimableAllocation({
    auction: AUCTION,
    dataSources: ENDED_GRADUATED,
    bids: [bid()],
    error: null,
    ...overrides,
  })
}

describe('resolveClaimableAllocation', () => {
  it('sums the unclaimed bids of a graduated auction', () => {
    expect(
      resolve({
        bids: [
          bid({ bidId: '1', amount: '1000' }),
          bid({ bidId: '2', amount: '500', status: 'exited' }),
          bid({ bidId: '3', amount: '700', status: 'claimed' }),
        ],
      }),
    ).toEqual({ status: ClaimableAllocationState.Claimable, amountRaw: 1500n })
  })

  it('hides an exact-zero allocation', () => {
    expect(resolve({ bids: [bid({ amount: '0' })] })).toEqual({ status: ClaimableAllocationState.NotEligible })
  })

  it('is not eligible when the wallet has no bids', () => {
    expect(resolve({ bids: [] })).toEqual({ status: ClaimableAllocationState.NotEligible })
  })

  it('is claimed once every bid is claimed', () => {
    expect(resolve({ bids: [bid({ status: 'claimed' }), bid({ bidId: '2', status: 'CLAIMED' })] })).toEqual({
      status: ClaimableAllocationState.Claimed,
    })
  })

  it('is not open before the claim block', () => {
    expect(
      resolve({ dataSources: { ...ENDED_GRADUATED, currentBlock: { status: 'success', blockNumber: 220n } } }),
    ).toEqual({ status: ClaimableAllocationState.NotOpen })
  })

  it('is not open while the auction is live', () => {
    expect(
      resolve({ dataSources: { ...ENDED_GRADUATED, currentBlock: { status: 'success', blockNumber: 150n } } }),
    ).toEqual({ status: ClaimableAllocationState.NotOpen })
  })

  it('is loading while the block number, raised total, or bids load', () => {
    expect(resolve({ dataSources: { ...ENDED_GRADUATED, currentBlock: { status: 'loading' } } })).toEqual({
      status: ClaimableAllocationState.Loading,
    })
    expect(resolve({ dataSources: { ...ENDED_GRADUATED, currencyRaised: { status: 'loading' } } })).toEqual({
      status: ClaimableAllocationState.Loading,
    })
    expect(resolve({ bids: undefined })).toEqual({ status: ClaimableAllocationState.Loading })
  })

  it('is unavailable instead of loading forever when the raised total never loads', () => {
    expect(resolve({ dataSources: { ...ENDED_GRADUATED, currencyRaised: { status: 'idle' } } })).toMatchObject({
      status: ClaimableAllocationState.Unavailable,
    })
  })

  it('is unavailable when the bids request failed, never zero', () => {
    const error = new Error('GetBidsByWallet failed')
    expect(resolve({ bids: undefined, error })).toEqual({ status: ClaimableAllocationState.Unavailable, error })
  })

  it('is unavailable when the block number or raised total failed', () => {
    expect(resolve({ dataSources: { ...ENDED_GRADUATED, currentBlock: { status: 'error' } } })).toMatchObject({
      status: ClaimableAllocationState.Unavailable,
    })
    expect(resolve({ dataSources: { ...ENDED_GRADUATED, currencyRaised: { status: 'error' } } })).toMatchObject({
      status: ClaimableAllocationState.Unavailable,
    })
  })

  it('is unavailable when a bid amount is not an integer', () => {
    expect(resolve({ bids: [bid({ amount: 'not-a-number' })] })).toMatchObject({
      status: ClaimableAllocationState.Unavailable,
    })
  })

  describe('auction that did not graduate', () => {
    const ENDED_FAILED: ClaimableAllocationDataSources = {
      ...ENDED_GRADUATED,
      currencyRaised: { status: 'success', currencyRaised: '10' },
    }

    it('refunds the full budget of every still-submitted bid in the bid currency', () => {
      expect(
        resolve({
          dataSources: ENDED_FAILED,
          bids: [
            bid({ bidId: '1', baseTokenInitial: '1000', currencySpent: '0', amount: '0' }),
            bid({ bidId: '2', baseTokenInitial: '250', currencySpent: '0', amount: '0' }),
            bid({ bidId: '3', baseTokenInitial: '700', status: 'exited' }),
          ],
        }),
      ).toEqual({ status: ClaimableAllocationState.Refundable, amountRaw: 1250n })
    })

    it('is not eligible without bids, or once every bid has been refunded', () => {
      expect(resolve({ dataSources: ENDED_FAILED, bids: [] })).toEqual({ status: ClaimableAllocationState.NotEligible })
      expect(resolve({ dataSources: ENDED_FAILED, bids: [bid({ status: 'exited' })] })).toEqual({
        status: ClaimableAllocationState.NotEligible,
      })
    })

    it('ignores the claim block: refunds open as soon as the auction ends', () => {
      expect(
        resolve({ dataSources: { ...ENDED_FAILED, currentBlock: { status: 'success', blockNumber: 200n } } }),
      ).toEqual({ status: ClaimableAllocationState.Refundable, amountRaw: 1000n })
    })

    it.each(['', ' ', '-1', '0x10', 'invalid'])('refunds with an invalid unused claim block %j', (claimBlock) => {
      expect(resolve({ auction: { ...AUCTION, claimBlock }, dataSources: ENDED_FAILED })).toEqual({
        status: ClaimableAllocationState.Refundable,
        amountRaw: 1000n,
      })
    })

    it.each(['', ' ', '-1', '0x10', '1.5', '1e3'])(
      'rejects invalid budget %j instead of displaying a refund',
      (baseTokenInitial) => {
        expect(resolve({ dataSources: ENDED_FAILED, bids: [bid({ baseTokenInitial })] }).status).toBe(
          ClaimableAllocationState.Unavailable,
        )
      },
    )

    it('uses normalized status and first bid ID with exact budget precision', () => {
      expect(
        resolve({
          dataSources: ENDED_FAILED,
          bids: [
            bid({ bidId: '1', status: 'SUBMITTED', baseTokenInitial: '9007199254740993' }),
            bid({ bidId: '1', baseTokenInitial: '9007199254740993' }),
            bid({ bidId: '2', status: 'EXITED', baseTokenInitial: '1000' }),
            bid({ bidId: '3', baseTokenInitial: '7' }),
          ],
        }),
      ).toEqual({ status: ClaimableAllocationState.Refundable, amountRaw: 9007199254741000n })
    })

    it('hides an exact-zero refund', () => {
      expect(resolve({ dataSources: ENDED_FAILED, bids: [bid({ baseTokenInitial: '0' })] })).toEqual({
        status: ClaimableAllocationState.NotEligible,
      })
    })

    it('is loading while the bids load, and unavailable when a budget is not an integer', () => {
      expect(resolve({ dataSources: ENDED_FAILED, bids: undefined })).toEqual({
        status: ClaimableAllocationState.Loading,
      })
      expect(resolve({ dataSources: ENDED_FAILED, bids: [bid({ baseTokenInitial: 'nope' })] })).toMatchObject({
        status: ClaimableAllocationState.Unavailable,
      })
    })

    it('keeps the claim path for an auction that graduated', () => {
      expect(resolve({ bids: [bid({ amount: '1000', baseTokenInitial: '5000' })] })).toEqual({
        status: ClaimableAllocationState.Claimable,
        amountRaw: 1000n,
      })
    })
  })

  it('counts a bid ID once using the same first-occurrence rule as the ADP', () => {
    expect(
      resolve({
        bids: [
          bid({ bidId: '1', amount: '500', status: 'EXITED' }),
          bid({ bidId: '1', amount: '500', status: 'exited' }),
          bid({ bidId: '2', amount: '250', status: 'submitted' }),
        ],
      }),
    ).toEqual({ status: ClaimableAllocationState.Claimable, amountRaw: 750n })
  })

  it('preserves exact raw amounts beyond Number precision', () => {
    expect(resolve({ bids: [bid({ amount: '9007199254740993' }), bid({ bidId: '2', amount: '7' })] })).toEqual({
      status: ClaimableAllocationState.Claimable,
      amountRaw: 9007199254741000n,
    })
  })

  it.each(['', ' ', '-1', '0x10', '1.5', '1e3'])('makes invalid amount %j unavailable', (amount) => {
    expect(resolve({ bids: [bid({ amount })] }).status).toBe(ClaimableAllocationState.Unavailable)
  })

  it.each(['', ' ', '-1', '0x10', 'invalid'])('makes invalid claim block %j unavailable', (claimBlock) => {
    expect(resolve({ auction: { ...AUCTION, claimBlock } }).status).toBe(ClaimableAllocationState.Unavailable)
  })

  it('does not require bids or treat a cached zero as final before the claim block', () => {
    expect(
      resolve({
        dataSources: { ...ENDED_GRADUATED, currentBlock: { status: 'success', blockNumber: 220n } },
        bids: undefined,
      }),
    ).toEqual({ status: ClaimableAllocationState.NotOpen })
  })

  it('allows claiming exactly at the claim block', () => {
    expect(
      resolve({ dataSources: { ...ENDED_GRADUATED, currentBlock: { status: 'success', blockNumber: 250n } } }),
    ).toEqual({ status: ClaimableAllocationState.Claimable, amountRaw: 1000n })
  })

  it('makes an invalid loaded outcome unavailable instead of loading forever', () => {
    expect(
      resolve({
        dataSources: { ...ENDED_GRADUATED, currencyRaised: { status: 'success', currencyRaised: 'invalid' } },
      }).status,
    ).toBe(ClaimableAllocationState.Unavailable)
  })

  it('keeps loading an unresolved outcome until the wallet bids arrive', () => {
    expect(
      resolve({
        dataSources: { ...ENDED_GRADUATED, currencyRaised: { status: 'success', currencyRaised: 'invalid' } },
        bids: undefined,
      }),
    ).toEqual({ status: ClaimableAllocationState.Loading })
  })

  it.each<[string, Partial<Parameters<typeof resolveClaimableAllocation>[0]>]>([
    [
      'an unresolved outcome',
      { dataSources: { ...ENDED_GRADUATED, currencyRaised: { status: 'success', currencyRaised: 'invalid' } } },
    ],
    ['a failed raised total', { dataSources: { ...ENDED_GRADUATED, currencyRaised: { status: 'error' } } }],
    ['a failed block read', { dataSources: { ...ENDED_GRADUATED, currentBlock: { status: 'error' } } }],
    ['an invalid claim block', { auction: { ...AUCTION, claimBlock: '' } }],
  ])('hides %s from a wallet without bids instead of showing an error', (_label, overrides) => {
    expect(resolve({ ...overrides, bids: [] })).toEqual({ status: ClaimableAllocationState.NotEligible })
  })
})

describe('hasClaimCardContent', () => {
  const error = new Error('failed')

  it.each<ClaimableAllocation>([
    { status: ClaimableAllocationState.Claimable, amountRaw: 1n },
    { status: ClaimableAllocationState.Refundable, amountRaw: 1n },
    { status: ClaimableAllocationState.Unavailable, error },
  ])('paints a card that can settle or retry: %o', (allocation) => {
    expect(hasClaimCardContent(allocation)).toBe(true)
  })

  it.each<ClaimableAllocation>([
    { status: ClaimableAllocationState.Loading },
    { status: ClaimableAllocationState.NotOpen },
    { status: ClaimableAllocationState.NotEligible },
    { status: ClaimableAllocationState.Claimed },
  ])("paints nothing for %o; a reserved slot is the outlet's call", (allocation) => {
    expect(hasClaimCardContent(allocation)).toBe(false)
  })
})
