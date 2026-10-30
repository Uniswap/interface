import type { PlainMessage } from '@bufbuild/protobuf'
import type { Launch, Launchpad } from '@uniswap/client-launches/dist/launches/v1/types_pb'
import { UniverseChainId } from '@universe/chains'
import {
  getAuctionTokenKey,
  getLaunchpadDisplay,
  toLaunchItems,
  UNISWAP_BONDING_CURVE_LAUNCHPAD_ID,
  UNISWAP_CCA_LAUNCHPAD_ID,
} from '~/pages/Launches/launchesModel'

const UNISWAP_LOGO_URL = 'ipfs://uniswap-mark'
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001'

// Mirrors prod ListLaunchpads: it carries the bonding-curve launchpad but has no `uniswap-cca` row.
const LAUNCHPADS: PlainMessage<Launchpad>[] = [
  { id: UNISWAP_BONDING_CURVE_LAUNCHPAD_ID, name: 'Uniswap', logoUrl: UNISWAP_LOGO_URL, protocol: undefined },
  { id: 'pons', name: 'Pons', logoUrl: 'ipfs://pons-mark', protocol: undefined },
]

const launchpadById = new Map(LAUNCHPADS.map((launchpad) => [launchpad.id, launchpad]))

function createLaunch(
  launchpadId: string,
  tokenLogoUrl?: string,
  chainId: number = UniverseChainId.Base,
): PlainMessage<Launch> {
  return {
    launchpadId,
    token: {
      chainId,
      address: TOKEN_ADDRESS,
      symbol: 'EGG',
      name: 'Egg',
      logoUrl: tokenLogoUrl,
    },
    poolId: '0xpool',
    hooksAddress: undefined,
    launchedAt: BigInt(0),
    graduated: undefined,
    stats: undefined,
    recentTrades: [],
    badges: [],
  }
}

describe('toLaunchItems launchpad identity', () => {
  it('resolves a launchpad that has a registry row', () => {
    const [item] = toLaunchItems({ launches: [createLaunch('pons')], launchpadById })

    expect(item.launchpadLabel).toBe('Pons')
    expect(item.launchpadLogoUrl).toBe('ipfs://pons-mark')
  })

  it('names and badges uniswap-cca despite it having no registry row', () => {
    const [item] = toLaunchItems({ launches: [createLaunch(UNISWAP_CCA_LAUNCHPAD_ID)], launchpadById })

    // Regression: the raw slug leaked into the card pill and the table's Launchpad cell, next to an
    // empty logo circle, because ListLaunchpads has no `uniswap-cca` entry.
    expect(item.launchpadLabel).toBe('Uniswap')
    expect(item.launchpadLogoUrl).toBe(UNISWAP_LOGO_URL)
  })

  it('names and badges uniswap-cca when its registry row is blank', () => {
    // `name` is a plain proto3 scalar, so a blank row serves `''` rather than omitting the field —
    // a nullish check would accept that and put an unnamed, unbadged pill back on the card.
    const withBlankCcaRow = new Map(launchpadById)
    withBlankCcaRow.set(UNISWAP_CCA_LAUNCHPAD_ID, {
      id: UNISWAP_CCA_LAUNCHPAD_ID,
      name: '',
      logoUrl: '',
      protocol: undefined,
    })

    const [item] = toLaunchItems({ launches: [createLaunch(UNISWAP_CCA_LAUNCHPAD_ID)], launchpadById: withBlankCcaRow })

    expect(item.launchpadLabel).toBe('Uniswap')
    expect(item.launchpadLogoUrl).toBe(UNISWAP_LOGO_URL)
  })

  it('still falls back to the raw id for an unknown launchpad', () => {
    const [item] = toLaunchItems({ launches: [createLaunch('brand-new-pad')], launchpadById })

    expect(item.launchpadLabel).toBe('brand-new-pad')
    expect(item.launchpadLogoUrl).toBeUndefined()
  })
})

describe('toLaunchItems detail route', () => {
  it('routes a pre-graduation CCA launch to its auction contract instead of its token address', () => {
    const auctionAddress = '0x0000000000000000000000000000000000000002'
    const auctionAddressByToken = new Map([
      [getAuctionTokenKey({ chainId: UniverseChainId.Base, tokenAddress: TOKEN_ADDRESS }), auctionAddress],
    ])
    const [item] = toLaunchItems({
      launches: [{ ...createLaunch(UNISWAP_CCA_LAUNCHPAD_ID), graduated: false }],
      launchpadById,
      auctionAddressByToken,
    })

    expect(item.detailPath).toBe(`/explore/auctions/base/${auctionAddress}`)
  })
})

describe('toLaunchItems token logo', () => {
  it('resolves an ipfs token logo through the dedicated IPFS gateway', () => {
    const [item] = toLaunchItems({
      launches: [createLaunch('pons', 'ipfs://bafkreicr5qh6v5b2lrn7734xkx7hy7vxgho4fqffahii5xy6bob36uvss4')],
      launchpadById,
    })

    expect(item.logoUrl).toBe('https://ipfs.pools.xyz/ipfs/bafkreicr5qh6v5b2lrn7734xkx7hy7vxgho4fqffahii5xy6bob36uvss4')
  })

  it('re-points a token logo already baked against a public gateway', () => {
    // Four in five launch logos arrive as `https://ipfs.io/ipfs/<cid>` rather than a raw `ipfs://`
    // uri, so resolving only the raw scheme left most of the surface on the third-party gateway.
    const [item] = toLaunchItems({
      launches: [
        createLaunch('pons', 'https://ipfs.io/ipfs/bafkreicr5qh6v5b2lrn7734xkx7hy7vxgho4fqffahii5xy6bob36uvss4'),
      ],
      launchpadById,
    })

    expect(item.logoUrl).toBe('https://ipfs.pools.xyz/ipfs/bafkreicr5qh6v5b2lrn7734xkx7hy7vxgho4fqffahii5xy6bob36uvss4')
  })

  it('passes a non-ipfs token logo through unchanged', () => {
    const [item] = toLaunchItems({
      launches: [createLaunch('pons', 'https://coin-images.coingecko.com/x.png')],
      launchpadById,
    })

    expect(item.logoUrl).toBe('https://coin-images.coingecko.com/x.png')
  })

  it('leaves a logo-less launch logo-less', () => {
    const [item] = toLaunchItems({ launches: [createLaunch('pons')], launchpadById })

    expect(item.logoUrl).toBeUndefined()
  })
})

describe('getLaunchpadDisplay', () => {
  it('resolves uniswap-cca (no registry row) for the Live-auctions Launchpad column', () => {
    const display = getLaunchpadDisplay({ launchpadId: UNISWAP_CCA_LAUNCHPAD_ID, launchpadById })

    expect(display.label).toBe('Uniswap')
    expect(display.logoUrl).toBe(UNISWAP_LOGO_URL)
  })

  it('prefers the registry row when one exists', () => {
    const display = getLaunchpadDisplay({ launchpadId: 'pons', launchpadById })

    expect(display.label).toBe('Pons')
    expect(display.logoUrl).toBe('ipfs://pons-mark')
  })

  it('falls back to the raw id for an unknown launchpad', () => {
    const display = getLaunchpadDisplay({ launchpadId: 'brand-new-pad', launchpadById })

    expect(display.label).toBe('brand-new-pad')
    expect(display.logoUrl).toBeUndefined()
  })
})

describe('toLaunchItems poolsTokenUrl', () => {
  // Literal URLs on purpose: Pools serves the same chain slugs this app routes on, and the pills
  // must land on the token page rather than the Pools home.
  it('points a Robinhood Chain launch at its Pools token page', () => {
    const [item] = toLaunchItems({
      launches: [createLaunch('pons', undefined, UniverseChainId.Robinhood)],
      launchpadById,
    })

    expect(item.poolsTokenUrl).toBe('https://pools.xyz/t/robinhood/0x0000000000000000000000000000000000000001')
  })

  it('points an Arc launch at its Pools token page', () => {
    const [item] = toLaunchItems({ launches: [createLaunch('pons', undefined, UniverseChainId.Arc)], launchpadById })

    expect(item.poolsTokenUrl).toBe('https://pools.xyz/t/arc/0x0000000000000000000000000000000000000001')
  })

  it('encodes a served address that is not a clean path segment', () => {
    const launch = createLaunch('pons', undefined, UniverseChainId.Robinhood)
    const [item] = toLaunchItems({
      launches: [{ ...launch, token: { ...launch.token!, address: '0xabc/../?x=1' } }],
      launchpadById,
    })

    expect(item.poolsTokenUrl).toBe('https://pools.xyz/t/robinhood/0xabc%2F..%2F%3Fx%3D1')
  })

  it('leaves a launch on an unsupported chain without a Pools url', () => {
    const [item] = toLaunchItems({ launches: [createLaunch('pons', undefined, 999999)], launchpadById })

    expect(item.poolsTokenUrl).toBeUndefined()
  })
})
