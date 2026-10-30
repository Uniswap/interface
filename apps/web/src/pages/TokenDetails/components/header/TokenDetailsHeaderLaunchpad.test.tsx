import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionType, type Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
import { type LaunchProvenance, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { mergeLaunchProvenance } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { getLaunchpadDestination } from '~/features/Toucan/Shared/ProvenanceLaunchpadLink'
import {
  TokenDetailsHeaderLaunchpad,
  type TokenDetailsHeaderLaunchpadModel,
  useTokenDetailsHeaderLaunchpad,
} from '~/pages/TokenDetails/components/header/TokenDetailsHeaderLaunchpad'
import {
  type TokenDetailsAuctionDisplayModel,
  useTokenDetailsAuctionDisplay,
} from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'
import { SERVED_CROWD_CCA_PROVENANCE, SERVED_CUSTOM_CCA_PROVENANCE } from '~/test-utils/tokenDetails/fixtures'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))
vi.mock('~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay', () => ({
  useTokenDetailsAuctionDisplay: vi.fn(),
}))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
// `sanitizeUrl` warns on a rejected launchpad url; the harness fails any test that reaches console.warn.
vi.mock('utilities/src/logger/logger', () => ({ logger: { warn: vi.fn() } }))

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'
const auction = {
  address: AUCTION_ADDRESS,
  createdAt: '2026-08-08T12:00:00Z',
  auctionType: AuctionType.CUSTOM,
} as PlainMessage<Auction>
const crowdAuction = { ...auction, auctionType: AuctionType.CROWD }

// oxlint-disable-next-line no-script-url -- the scheme the http(s) guard must reject
const SCRIPT_URL = 'javascript:alert(1)'

const PONS: LaunchProvenance['launchpad'] = {
  id: 'pons',
  name: 'Pons',
  logoUrl: 'https://example.com/pons.png',
  url: 'https://pons.example',
}

function mockDisplay(overrides: Partial<TokenDetailsAuctionDisplayModel> = {}): void {
  const resolvedAuction = 'auction' in overrides ? overrides.auction : auction
  mocked(useTokenDetailsAuctionDisplay).mockReturnValue({
    isInitialLoading: false,
    isAuctionOnlyPending: false,
    hasConfirmedPool: false,
    auction: resolvedAuction,
    chainId: UniverseChainId.Mainnet,
    launchMethod: LaunchProvenanceMethod.CustomAuction,
    // As the provider resolves it, so an overridden auction carries its own attribution.
    provenance: mergeLaunchProvenance({ served: SERVED_CUSTOM_CCA_PROVENANCE, auction: resolvedAuction }),
    phase: AuctionDisplayPhase.Ended,
    result: AuctionDisplayResult.Unknown,
    poolAvailability: PoolAvailability.HasPool,
    shouldShowSwap: true,
    phaseEndsAtMs: undefined,
    currencyRaised: { status: 'idle' },
    currentBlock: { status: 'success', blockNumber: 300n },
    refetchCurrentBlock: vi.fn(),
    ...overrides,
  })
}

/** Mirrors the header: the hook decides, the component only renders what it is given. */
function HeaderLaunchpad(): JSX.Element | null {
  const model = useTokenDetailsHeaderLaunchpad()
  return model ? <TokenDetailsHeaderLaunchpad {...model} /> : null
}

/** The props the hook would hand a third-party launchpad, so the presentational tests skip the hook. */
function thirdParty(launchpad: LaunchProvenance['launchpad']): TokenDetailsHeaderLaunchpadModel {
  return {
    launchpad,
    ...getLaunchpadDestination({ provenance: { launchpad, method: LaunchProvenanceMethod.ThirdParty } }),
    launchMethod: 'third_party',
    onLaunchesPress: vi.fn(),
  }
}

function getChipLink(): HTMLAnchorElement | null {
  return screen.getByTestId(TestID.TokenDetailsHeaderLaunchpad).closest('a')
}

describe('TokenDetailsHeaderLaunchpad', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mocked(sendAnalyticsEvent).mockReset()
    mockDisplay()
  })

  it('links a Custom auction to Explore’s auctions tab and reports the click', async () => {
    render(<HeaderLaunchpad />)

    expect(screen.getByText('Uniswap')).toBeInTheDocument()
    // The CCA launchpad has no served logo, so the Uniswap mark stands in.
    expect(screen.queryByTestId(TestID.LaunchpadLogo)).toBeNull()
    const link = getChipLink()
    expect(link).toHaveAttribute('href', '/explore/auctions')
    expect(link).not.toHaveAttribute('target')

    fireEvent.mouseEnter(screen.getByTestId(TestID.TokenDetailsHeaderLaunchpad))
    await waitFor(() => expect(screen.getByText('Launched on Uniswap')).toBeVisible())
    expect(screen.getByText('View all Uniswap launches')).toBeInTheDocument()

    fireEvent.click(link as HTMLAnchorElement)
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      AuctionEventName.TokenDetailsToLaunchesClicked,
      expect.objectContaining({
        surface: 'tdp',
        chain_id: UniverseChainId.Mainnet,
        launch_method: 'custom',
        entry_point: 'tdp_header_launchpad',
        destination: 'explore_auctions',
      }),
    )
  })

  it('attributes a Crowd Launch to pools.xyz and links out to it in a new tab', async () => {
    mockDisplay({
      auction: crowdAuction,
      chainId: UniverseChainId.Robinhood,
      launchMethod: LaunchProvenanceMethod.CrowdLaunch,
      provenance: mergeLaunchProvenance({ served: SERVED_CROWD_CCA_PROVENANCE, auction: crowdAuction }),
    })

    render(<HeaderLaunchpad />)

    expect(screen.getByText('pools.xyz')).toBeInTheDocument()
    expect(screen.queryByText('Uniswap')).toBeNull()
    expect(screen.queryByTestId(TestID.LaunchpadLogo)).toBeNull()
    const link = getChipLink()
    expect(link).toHaveAttribute('href', 'https://pools.xyz')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    fireEvent.mouseEnter(screen.getByTestId(TestID.TokenDetailsHeaderLaunchpad))
    await waitFor(() => expect(screen.getByText('Launched on pools.xyz')).toBeVisible())
    expect(screen.getByText('View all pools.xyz launches')).toBeInTheDocument()

    // Leaving for pools.xyz is not an in-app launches navigation.
    fireEvent.click(link as HTMLAnchorElement)
    expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(
      AuctionEventName.TokenDetailsToLaunchesClicked,
      expect.anything(),
    )
  })

  it('links a third-party launchpad to its site with its served logo', () => {
    // Rendered from props alone: the chip never reads the display state, so this needs no hook mock.
    mocked(useTokenDetailsAuctionDisplay).mockReset()
    const onLaunchesPress = vi.fn()
    render(<TokenDetailsHeaderLaunchpad {...thirdParty(PONS)} onLaunchesPress={onLaunchesPress} />)

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.LaunchpadLogo)).toBeInTheDocument()
    const link = getChipLink()
    expect(link).toHaveAttribute('href', 'https://pons.example')
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Launched on Pons')).toBeInTheDocument()

    fireEvent.click(link as HTMLAnchorElement)
    expect(onLaunchesPress).not.toHaveBeenCalled()
  })

  it('renders a third-party launchpad with a non-http(s) url as a static label', () => {
    render(<TokenDetailsHeaderLaunchpad {...thirdParty({ ...PONS, url: SCRIPT_URL })} />)

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(getChipLink()).toBeNull()
    fireEvent.mouseEnter(screen.getByTestId(TestID.TokenDetailsHeaderLaunchpad))
    expect(screen.queryByText('Launched on Pons')).toBeNull()
  })

  it('renders a launchpad without a destination as a static label', () => {
    render(<TokenDetailsHeaderLaunchpad {...thirdParty({ ...PONS, url: undefined })} />)

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(getChipLink()).toBeNull()
    fireEvent.mouseEnter(screen.getByTestId(TestID.TokenDetailsHeaderLaunchpad))
    expect(screen.queryByText('Launched on Pons')).toBeNull()
  })

  it('attributes a served launch the page found no auction for', () => {
    mockDisplay({
      auction: undefined,
      launchMethod: LaunchProvenanceMethod.Unknown,
      provenance: { launchpad: PONS, method: LaunchProvenanceMethod.InstantLaunch },
    })

    render(<HeaderLaunchpad />)

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(getChipLink()).toHaveAttribute('href', 'https://pons.example')
  })

  it('renders nothing for a token with no attributed launch', () => {
    mockDisplay({ auction: undefined, launchMethod: LaunchProvenanceMethod.Unknown, provenance: undefined })

    render(<HeaderLaunchpad />)

    expect(screen.queryByTestId(TestID.TokenDetailsHeaderLaunchpad)).toBeNull()
  })

  it('renders nothing while the provenance flag is off', () => {
    mocked(useFeatureFlag).mockReturnValue(false)

    render(<HeaderLaunchpad />)

    expect(screen.queryByTestId(TestID.TokenDetailsHeaderLaunchpad)).toBeNull()
  })
})
