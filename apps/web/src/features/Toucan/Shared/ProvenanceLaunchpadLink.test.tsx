import { Text } from '@universe/mycelium'
import { type LaunchProvenance, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { ElementName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  getLaunchpadDestination,
  type LaunchpadDestination,
  ProvenanceLaunchpadLink,
} from '~/features/Toucan/Shared/ProvenanceLaunchpadLink'
import { act, fireEvent, render, screen } from '~/test-utils/render'

// `sanitizeUrl` warns on a rejected launchpad url; the harness fails any test that reaches console.warn.
vi.mock('utilities/src/logger/logger', () => ({ logger: { warn: vi.fn() } }))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

const TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'
const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'
// oxlint-disable-next-line no-script-url -- the scheme the http(s) guard must reject
const SCRIPT_URL = 'javascript:alert(1)'

const PONS: LaunchProvenance['launchpad'] = {
  id: 'pons',
  name: 'Pons',
  logoUrl: 'https://example.com/pons.png',
  url: 'https://pons.example',
}

function renderLink(launchpad: LaunchProvenance['launchpad'], destination: LaunchpadDestination): void {
  render(
    <ProvenanceLaunchpadLink
      launchpad={launchpad}
      {...destination}
      element={ElementName.ProvenanceHeaderLaunchpad}
      launchMethod="third_party"
      tokenAddress={TOKEN_ADDRESS}
      onPress={vi.fn()}
    >
      <Text>{launchpad.name}</Text>
    </ProvenanceLaunchpadLink>,
  )
}

describe('ProvenanceLaunchpadLink', () => {
  it('sends the tooltip line that names the destination to that same destination', () => {
    renderLink(PONS, { href: 'https://pons.example', isExternal: true })

    const viewAll = screen.getByText('View all Pons launches').closest('a')
    expect(viewAll).toHaveAttribute('href', 'https://pons.example')
    expect(viewAll).toHaveAttribute('target', '_blank')
    expect(viewAll).toHaveAttribute('rel', 'noopener noreferrer')
    // The affordance itself keeps its own link, so both lead to the launchpad's listing.
    expect(screen.getByText('Pons').closest('a')).toHaveAttribute('href', 'https://pons.example')
  })

  it('reports opening the tooltip with where it sits and the token', async () => {
    renderLink(PONS, { href: 'https://pons.example', isExternal: true })

    // Popper repositions asynchronously on open.
    await act(async () => {
      fireEvent.mouseEnter(screen.getByText('Pons'))
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(UniswapEventName.TooltipOpened, {
      element: ElementName.ProvenanceHeaderLaunchpad,
      tooltip_name: 'provenance_launchpad_tooltip',
      token_address: TOKEN_ADDRESS,
    })
  })

  it('renders children bare with no tooltip when the launchpad has nowhere to lead', () => {
    renderLink(PONS, { href: undefined, isExternal: true })

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(screen.queryByText('Launched on Pons')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('getLaunchpadDestination', () => {
  const uniswap = { id: 'uniswap-cca', name: 'Uniswap' }

  it.each<[string, LaunchProvenance, LaunchpadDestination]>([
    [
      'Custom auction → Explore’s auctions tab',
      { launchpad: uniswap, method: LaunchProvenanceMethod.CustomAuction, auctionAddress: AUCTION_ADDRESS },
      { href: '/explore/auctions', isExternal: false },
    ],
    [
      'Crowd Launch → pools.xyz root',
      {
        launchpad: { id: 'pools', name: 'pools.xyz', url: 'https://pools.xyz' },
        method: LaunchProvenanceMethod.CrowdLaunch,
        auctionAddress: AUCTION_ADDRESS,
      },
      { href: 'https://pools.xyz', isExternal: true },
    ],
    [
      'third party with a site → that site',
      { launchpad: PONS, method: LaunchProvenanceMethod.ThirdParty },
      { href: 'https://pons.example', isExternal: true },
    ],
    [
      'third party with a non-http(s) site → nowhere',
      { launchpad: { ...PONS, url: SCRIPT_URL }, method: LaunchProvenanceMethod.ThirdParty },
      { href: undefined, isExternal: true },
    ],
    [
      'third party without a site → nowhere',
      { launchpad: { ...PONS, url: undefined }, method: LaunchProvenanceMethod.ThirdParty },
      { href: undefined, isExternal: true },
    ],
    [
      'unclassified auction → nowhere',
      { launchpad: uniswap, method: LaunchProvenanceMethod.Unknown, auctionAddress: AUCTION_ADDRESS },
      { href: undefined, isExternal: true },
    ],
  ])('%s', (_name, provenance, expected) => {
    expect(getLaunchpadDestination({ provenance })).toEqual(expected)
  })
})
