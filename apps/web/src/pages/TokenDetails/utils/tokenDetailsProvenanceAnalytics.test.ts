import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionType, type Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CurrentBlockState } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { resolveTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'
import {
  getTokenDetailsProvenanceProperties,
  sendTokenDetailsProvenanceEvent,
} from '~/pages/TokenDetails/utils/tokenDetailsProvenanceAnalytics'
import type { TokenPoolState } from '~/types/tokenPool'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

const AUCTION = {
  address: '0x1111111111111111111111111111111111111111',
  tokenAddress: '0x3333333333333333333333333333333333333333',
  auctionType: AuctionType.CUSTOM,
  isQuickLaunch: false,
  startBlock: '100',
  endBlock: '200',
} as PlainMessage<Auction>

const LIVE_BLOCK: CurrentBlockState = { status: 'success', blockNumber: 150n }
const NO_POOL: TokenPoolState = { status: 'success', poolCount: 0 }

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

describe('TDP provenance analytics', () => {
  beforeEach(() => {
    vi.mocked(sendAnalyticsEvent).mockClear()
  })

  it('uses the same bounded properties for impressions and navigation events', () => {
    const display = resolve()
    const context = { entry_point: 'tdp_countdown_module', auction_count: 2 } as const
    const properties = getTokenDetailsProvenanceProperties(display, context)

    expect(properties).toEqual({
      surface: 'tdp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'custom',
      launch_method: 'custom',
      auction_phase: 'live',
      pool_availability: 'no_pool',
      page_layout: 'auction_only',
      ...context,
    })

    sendTokenDetailsProvenanceEvent({
      eventName: AuctionEventName.TokenDetailsToAuctionDetailsClicked,
      display,
      ...context,
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
      AuctionEventName.TokenDetailsToAuctionDetailsClicked,
      properties,
    )
  })

  it('classifies a served launch the page found no auction for', () => {
    const display = resolve({
      auction: undefined,
      servedProvenance: {
        launchpad: { id: 'pons', name: 'Pons' },
        method: LaunchProvenanceMethod.InstantLaunch,
      },
    })

    // The launch is an Instant Launch; the page it is shown on is still an ordinary trading TDP.
    expect(getTokenDetailsProvenanceProperties(display, {})).toEqual(
      expect.objectContaining({ launch_method: 'instant', auction_type: 'unknown', page_layout: 'trading' }),
    )
  })

  it('does not build or send auction properties without a chain', () => {
    const display = resolve({ chainId: undefined })

    expect(getTokenDetailsProvenanceProperties(display, {})).toBeUndefined()
    sendTokenDetailsProvenanceEvent({ eventName: AuctionEventName.ProvenanceModuleViewed, display })

    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })
})
