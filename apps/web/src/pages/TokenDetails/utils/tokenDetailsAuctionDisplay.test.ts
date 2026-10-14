import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionType, type Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { describe, expect, it } from 'vitest'
import {
  AuctionDisplayPhase,
  PoolAvailability,
  type CurrentBlockState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import {
  resolveTokenDetailsAuctionDisplay,
  shouldReserveLiveAuctionBannerSpace,
  shouldShowAuctionOnlyLayout,
  shouldShowLiveAuctionBanner,
  toSeconds,
} from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'
import type { TokenPoolState } from '~/types/tokenPool'

const END_SECONDS = 1_800_000_000n
const AUCTION = {
  address: '0x1111111111111111111111111111111111111111',
  tokenAddress: '0x3333333333333333333333333333333333333333',
  auctionType: AuctionType.CUSTOM,
  isQuickLaunch: false,
  startBlock: '100',
  endBlock: '200',
  estimatedStartTime: { seconds: END_SECONDS - 1000n, nanos: 500_000_000 },
  estimatedEndTime: { seconds: END_SECONDS, nanos: 0 },
} as PlainMessage<Auction>

const LIVE_BLOCK: CurrentBlockState = { status: 'success', blockNumber: 150n }
const NO_POOL: TokenPoolState = { status: 'success', poolCount: 0 }
const HAS_POOL: TokenPoolState = { status: 'success', poolCount: 1 }

function resolve(
  overrides: Partial<Parameters<typeof resolveTokenDetailsAuctionDisplay>[0]> = {},
): ReturnType<typeof resolveTokenDetailsAuctionDisplay> {
  return resolveTokenDetailsAuctionDisplay({
    auction: AUCTION,
    chainId: UniverseChainId.Mainnet,
    currentBlock: LIVE_BLOCK,
    currencyRaised: { status: 'idle' },
    pools: NO_POOL,
    ...overrides,
  })
}

describe('resolveTokenDetailsAuctionDisplay', () => {
  it('returns an inert model without an auction', () => {
    const display = resolve({ auction: undefined })

    expect(display).toMatchObject({
      auction: undefined,
      phase: AuctionDisplayPhase.Unknown,
      phaseEndsAtMs: undefined,
      shouldShowSwap: true,
    })
    expect(display.launchMethod).toBe(LaunchProvenanceMethod.Unknown)
    expect(shouldShowAuctionOnlyLayout(display)).toBe(false)
    expect(shouldShowLiveAuctionBanner(display)).toBe(false)
  })

  const POOL_CASES: [TokenPoolState, PoolAvailability, boolean][] = [
    [{ status: 'loading' }, PoolAvailability.Loading, false],
    [{ status: 'error' }, PoolAvailability.Error, false],
    [{ status: 'success', poolCount: 0 }, PoolAvailability.NoPool, true],
    [{ status: 'success', poolCount: 1 }, PoolAvailability.HasPool, false],
  ]

  describe.each([
    ['upcoming', 50n, AuctionDisplayPhase.Upcoming],
    ['live', 150n, AuctionDisplayPhase.Live],
    ['ended', 250n, AuctionDisplayPhase.Ended],
  ])('%s auction with an explicit known Custom presentation method', (_label, blockNumber, phase) => {
    it.each(POOL_CASES)('with pools %j resolves %s, auction-only layout %s', (pools, poolAvailability, auctionOnly) => {
      const display = resolve({ currentBlock: { status: 'success', blockNumber }, pools })

      expect(display.phase).toBe(phase)
      expect(display.poolAvailability).toBe(poolAvailability)
      expect(display.shouldShowSwap).toBe(!auctionOnly)
      expect(shouldShowAuctionOnlyLayout(display)).toBe(auctionOnly && phase !== AuctionDisplayPhase.Ended)
      expect(shouldShowLiveAuctionBanner(display)).toBe(
        phase === AuctionDisplayPhase.Live && poolAvailability === PoolAvailability.HasPool,
      )
    })
  })

  it('keeps the known Custom auction layout but no countdown when the block read failed', () => {
    const display = resolve({ currentBlock: { status: 'error' } })

    expect(display.phase).toBe(AuctionDisplayPhase.Unknown)
    expect(display.phaseEndsAtMs).toBeUndefined()
    expect(shouldShowAuctionOnlyLayout(display)).toBe(true)
  })

  it.each([false, true])('does not classify the wire boolean isQuickLaunch=%s', (isQuickLaunch) => {
    const display = resolve({ auction: { ...AUCTION, auctionType: AuctionType.UNSPECIFIED, isQuickLaunch } })

    expect(display.launchMethod).toBe(LaunchProvenanceMethod.Unknown)
    expect(shouldShowAuctionOnlyLayout(display)).toBe(false)
    expect(
      shouldShowLiveAuctionBanner(
        resolve({ auction: { ...AUCTION, auctionType: AuctionType.UNSPECIFIED, isQuickLaunch }, pools: HAS_POOL }),
      ),
    ).toBe(false)
  })

  it('never applies the auction layout to an explicit known Crowd presentation method', () => {
    expect(shouldShowAuctionOnlyLayout(resolve({ auction: { ...AUCTION, auctionType: AuctionType.CROWD } }))).toBe(
      false,
    )
  })

  it('reserves banner space during the initial load only for a live Custom auction', () => {
    expect(shouldReserveLiveAuctionBannerSpace({ ...resolve({ pools: HAS_POOL }), isInitialLoading: true })).toBe(true)
    expect(
      shouldReserveLiveAuctionBannerSpace({
        ...resolve({ auction: { ...AUCTION, auctionType: AuctionType.CROWD }, pools: HAS_POOL }),
        isInitialLoading: true,
      }),
    ).toBe(false)
  })

  it('counts down to the indexed end estimate while live', () => {
    expect(resolve().phaseEndsAtMs).toBe(Number(END_SECONDS) * 1000)
  })

  it('counts down to the optional start estimate while upcoming', () => {
    const display = resolve({ currentBlock: { status: 'success', blockNumber: 50n } })

    expect(display.phaseEndsAtMs).toBe(Number(END_SECONDS - 1000n) * 1000 + 500)
    expect(
      resolve({
        auction: { ...AUCTION, estimatedStartTime: undefined },
        currentBlock: { status: 'success', blockNumber: 50n },
      }).phaseEndsAtMs,
    ).toBeUndefined()
  })

  it('has no countdown target once ended or without an end estimate', () => {
    expect(resolve({ currentBlock: { status: 'success', blockNumber: 250n } }).phaseEndsAtMs).toBeUndefined()
    expect(resolve({ auction: { ...AUCTION, estimatedEndTime: undefined } }).phaseEndsAtMs).toBeUndefined()
  })
})

describe('toSeconds', () => {
  it('converts a timestamp to whole seconds', () => {
    expect(toSeconds({ seconds: 1_002_000n, nanos: 0 })).toBe(1_002_000n)
    expect(toSeconds(undefined)).toBeUndefined()
  })
})
