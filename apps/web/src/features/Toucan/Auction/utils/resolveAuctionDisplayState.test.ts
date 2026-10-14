import { describe, expect, it } from 'vitest'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  resolveAuctionDisplayState,
  type CurrencyRaisedState,
  type CurrentBlockState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import type { TokenPoolState } from '~/types/tokenPool'

const AUCTION = {
  startBlock: '100',
  endBlock: '200',
  requiredCurrencyRaised: '1000',
}

const CURRENT_BLOCK: CurrentBlockState = { status: 'success', blockNumber: 150n }
const POOLS: TokenPoolState = { status: 'success', poolCount: 1 }
const CURRENCY_RAISED: CurrencyRaisedState = { status: 'success', currencyRaised: '500' }

function resolve(
  overrides: Partial<Parameters<typeof resolveAuctionDisplayState>[0]> = {},
): ReturnType<typeof resolveAuctionDisplayState> {
  return resolveAuctionDisplayState({
    auction: AUCTION,
    currentBlock: CURRENT_BLOCK,
    currencyRaised: CURRENCY_RAISED,
    pools: POOLS,
    ...overrides,
  })
}

describe('resolveAuctionDisplayState', () => {
  it('returns unknown auction state and keeps swap visible without an auction', () => {
    const state = resolve({
      auction: null,
      currentBlock: { status: 'loading' },
      pools: { status: 'success', poolCount: 0 },
    })

    expect(state.phase).toBe(AuctionDisplayPhase.Unknown)
    expect(state.result).toBe(AuctionDisplayResult.Unknown)
    expect(state.poolAvailability).toBe(PoolAvailability.NoPool)
    expect(state.shouldShowSwap).toBe(true)
  })

  describe('phase', () => {
    it.each([
      [{ status: 'loading' } as const, AuctionDisplayPhase.Loading],
      [{ status: 'error' } as const, AuctionDisplayPhase.Unknown],
    ])('maps the current block state %#', (currentBlock, expected) => {
      expect(resolve({ currentBlock }).phase).toBe(expected)
    })

    it.each([
      [99n, AuctionDisplayPhase.Upcoming],
      [100n, AuctionDisplayPhase.Live],
      [199n, AuctionDisplayPhase.Live],
      [200n, AuctionDisplayPhase.Ended],
    ])('maps block %s to %s', (blockNumber, expected) => {
      expect(resolve({ currentBlock: { status: 'success', blockNumber } }).phase).toBe(expected)
    })

    it('preserves block precision above Number.MAX_SAFE_INTEGER', () => {
      const startBlock = BigInt(Number.MAX_SAFE_INTEGER) + 1n

      expect(
        resolve({
          auction: {
            ...AUCTION,
            startBlock: startBlock.toString(),
            endBlock: (startBlock + 2n).toString(),
          },
          currentBlock: { status: 'success', blockNumber: startBlock + 1n },
        }).phase,
      ).toBe(AuctionDisplayPhase.Live)
    })

    it.each([
      [{ ...AUCTION, startBlock: '' }],
      [{ ...AUCTION, startBlock: 'invalid' }],
      [{ ...AUCTION, startBlock: '-1' }],
      [{ ...AUCTION, endBlock: '' }],
      [{ ...AUCTION, endBlock: 'invalid' }],
      [{ ...AUCTION, endBlock: '-1' }],
    ])('is unknown when auction block bounds are missing or malformed', (auction) => {
      expect(resolve({ auction }).phase).toBe(AuctionDisplayPhase.Unknown)
    })
  })

  describe('result', () => {
    it.each([99n, 100n, 199n])('stays unknown before the auction ends at block %s', (blockNumber) => {
      expect(
        resolve({
          currentBlock: { status: 'success', blockNumber },
          currencyRaised: { status: 'success', currencyRaised: '1000' },
        }).result,
      ).toBe(AuctionDisplayResult.Unknown)
    })

    it.each(['1000', '1001'])('is successful when an ended auction raised %s', (currencyRaised) => {
      expect(
        resolve({
          currentBlock: { status: 'success', blockNumber: 200n },
          currencyRaised: { status: 'success', currencyRaised },
        }).result,
      ).toBe(AuctionDisplayResult.Successful)
    })

    it('is failed when a settled checkpoint did not meet the required raise', () => {
      expect(
        resolve({
          currentBlock: { status: 'success', blockNumber: 200n },
          currencyRaised: { status: 'success', currencyRaised: '999' },
        }).result,
      ).toBe(AuctionDisplayResult.Failed)
    })

    it.each([{ status: 'idle' }, { status: 'loading' }, { status: 'error' }] as const)(
      'is unknown when currency raised is $status',
      (currencyRaised) => {
        expect(resolve({ currentBlock: { status: 'success', blockNumber: 200n }, currencyRaised }).result).toBe(
          AuctionDisplayResult.Unknown,
        )
      },
    )

    it.each(['', 'invalid'])('is unknown when currency raised is %s', (currencyRaised) => {
      expect(
        resolve({
          currentBlock: { status: 'success', blockNumber: 200n },
          currencyRaised: { status: 'success', currencyRaised },
        }).result,
      ).toBe(AuctionDisplayResult.Unknown)
    })

    it.each([undefined, '', 'invalid'])('is unknown when required currency raised is %s', (requiredCurrencyRaised) => {
      expect(
        resolve({
          auction: { ...AUCTION, requiredCurrencyRaised },
          currentBlock: { status: 'success', blockNumber: 200n },
          currencyRaised: { status: 'success', currencyRaised: '1000' },
        }).result,
      ).toBe(AuctionDisplayResult.Unknown)
    })
  })

  describe('pool availability and swap visibility', () => {
    it.each([
      [{ status: 'loading' } as const, PoolAvailability.Loading, true],
      [{ status: 'error' } as const, PoolAvailability.Error, true],
      [{ status: 'success', poolCount: 1 } as const, PoolAvailability.HasPool, true],
      [{ status: 'success', poolCount: 0 } as const, PoolAvailability.NoPool, false],
    ])('maps pool state %#', (pools, poolAvailability, shouldShowSwap) => {
      const state = resolve({ pools })

      expect(state.poolAvailability).toBe(poolAvailability)
      expect(state.shouldShowSwap).toBe(shouldShowSwap)
    })

    it.each([-1, Number.NaN])('fails open for malformed pool count %s', (poolCount) => {
      const state = resolve({ pools: { status: 'success', poolCount } })

      expect(state.poolAvailability).toBe(PoolAvailability.Error)
      expect(state.shouldShowSwap).toBe(true)
    })
  })
})
