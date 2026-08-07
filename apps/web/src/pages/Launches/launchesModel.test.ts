import type { PlainMessage } from '@bufbuild/protobuf'
import type { Launch, Launchpad } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  getLaunchpadDisplay,
  toLaunchItems,
  UNISWAP_BONDING_CURVE_LAUNCHPAD_ID,
  UNISWAP_CCA_LAUNCHPAD_ID,
} from '~/pages/Launches/launchesModel'

const UNISWAP_LOGO_URL = 'ipfs://uniswap-mark'

// Mirrors prod ListLaunchpads: it carries the bonding-curve launchpad but has no `uniswap-cca` row.
const LAUNCHPADS: PlainMessage<Launchpad>[] = [
  { id: UNISWAP_BONDING_CURVE_LAUNCHPAD_ID, name: 'Uniswap', logoUrl: UNISWAP_LOGO_URL, protocol: undefined },
  { id: 'pons', name: 'Pons', logoUrl: 'ipfs://pons-mark', protocol: undefined },
]

const launchpadById = new Map(LAUNCHPADS.map((launchpad) => [launchpad.id, launchpad]))

function createLaunch(launchpadId: string): PlainMessage<Launch> {
  return {
    launchpadId,
    token: {
      chainId: UniverseChainId.Base,
      address: '0x0000000000000000000000000000000000000001',
      symbol: 'EGG',
      name: 'Egg',
      logoUrl: undefined,
    },
    poolId: '0xpool',
    hooksAddress: undefined,
    launchedAt: BigInt(0),
    graduated: undefined,
    stats: undefined,
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
