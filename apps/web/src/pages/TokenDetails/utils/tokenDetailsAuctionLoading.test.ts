import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionType, type Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionDisplayPhase, PoolAvailability } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { resolveInitialAuctionLoading } from '~/pages/TokenDetails/utils/tokenDetailsAuctionLoading'

const pendingAuction = {
  auction: {
    auctionType: AuctionType.CUSTOM,
    tokenAddress: '0x1111111111111111111111111111111111111111',
  } as PlainMessage<Auction>,
  chainId: UniverseChainId.Mainnet,
  launchMethod: LaunchProvenanceMethod.CustomAuction,
  phase: AuctionDisplayPhase.Live,
  poolAvailability: PoolAvailability.Loading,
} satisfies Parameters<typeof resolveInitialAuctionLoading>[0]['display']

function resolve(overrides: Partial<Parameters<typeof resolveInitialAuctionLoading>[0]> = {}) {
  return resolveInitialAuctionLoading({
    previous: { pageKey: 'ethereum:token-a', pending: undefined },
    pageKey: 'ethereum:token-a',
    isPageReady: true,
    isOnline: true,
    display: pendingAuction,
    ...overrides,
  })
}

describe('resolveInitialAuctionLoading', () => {
  it('waits for canonical content before choosing a pending layout', () => {
    expect(resolve({ isPageReady: false }).pending).toBeUndefined()
    expect(resolve().pending).toBe(true)
  })

  it('allows an upcoming Custom auction to reserve its sidebar', () => {
    expect(resolve({ display: { ...pendingAuction, phase: AuctionDisplayPhase.Upcoming } }).pending).toBe(true)
  })

  it.each([
    { ...pendingAuction, auction: undefined },
    { ...pendingAuction, launchMethod: LaunchProvenanceMethod.CrowdLaunch },
    { ...pendingAuction, launchMethod: LaunchProvenanceMethod.InstantLaunch },
    { ...pendingAuction, launchMethod: LaunchProvenanceMethod.Unknown },
    { ...pendingAuction, auction: { ...pendingAuction.auction, tokenAddress: '' } },
    { ...pendingAuction, auction: { ...pendingAuction.auction, tokenAddress: 'invalid' } },
    { ...pendingAuction, chainId: undefined },
    { ...pendingAuction, phase: AuctionDisplayPhase.Loading },
    { ...pendingAuction, phase: AuctionDisplayPhase.Unknown },
    { ...pendingAuction, phase: AuctionDisplayPhase.Ended },
    { ...pendingAuction, poolAvailability: PoolAvailability.HasPool },
    { ...pendingAuction, poolAvailability: PoolAvailability.NoPool },
    { ...pendingAuction, poolAvailability: PoolAvailability.Error },
  ])('keeps the normal layout without an active Custom awaiting pools: %j', (display) => {
    expect(resolve({ display }).pending).toBe(false)
  })

  it('does not add a skeleton when the auction arrives after normal content', () => {
    const normal = resolve({ display: { ...pendingAuction, auction: undefined } })
    expect(resolve({ previous: normal }).pending).toBe(false)
  })

  it.each([PoolAvailability.HasPool, PoolAvailability.NoPool, PoolAvailability.Error])(
    'leaves initial loading when pools settle as %s and does not restart it',
    (poolAvailability) => {
      const settled = resolve({ previous: resolve(), display: { ...pendingAuction, poolAvailability } })
      expect(settled.pending).toBe(false)
      expect(resolve({ previous: settled }).pending).toBe(false)
    },
  )

  it('fails open offline and does not introduce a skeleton on reconnect', () => {
    const offline = resolve({ previous: resolve(), isOnline: false })
    expect(offline.pending).toBe(false)
    expect(resolve({ previous: offline }).pending).toBe(false)
  })

  it('resets the decision when navigating to a different token or chain', () => {
    const previous = resolve({ display: { ...pendingAuction, auction: undefined } })
    expect(resolve({ previous, pageKey: 'base:token-b', isPageReady: false })).toEqual({
      pageKey: 'base:token-b',
      pending: undefined,
    })
    expect(resolve({ previous, pageKey: 'base:token-b' }).pending).toBe(true)
  })
})
