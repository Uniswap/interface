import { AuctionType, type Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
import {
  TokenDetailsHeaderLaunchpad,
  useTokenDetailsHeaderLaunchpad,
} from '~/pages/TokenDetails/components/header/TokenDetailsHeaderLaunchpad'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))

const auction = {
  address: '0x1111111111111111111111111111111111111111',
  createdAt: '2026-08-08T12:00:00Z',
  auctionType: AuctionType.CUSTOM,
} as Auction

function mockStore(auctionSource: TokenDetailsAuctionSource): void {
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
    selector({ auctionSource } as TDPState)) as typeof useTDPStore)
}

/** Mirrors the header: the hook decides, the component only renders what it is given. */
function HeaderLaunchpad(): JSX.Element | null {
  const launchpad = useTokenDetailsHeaderLaunchpad()
  return launchpad ? <TokenDetailsHeaderLaunchpad launchpad={launchpad} /> : null
}

describe('TokenDetailsHeaderLaunchpad', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(true)
  })

  it('names the Uniswap launchpad for a resolved auction', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })

    render(<HeaderLaunchpad />)

    expect(screen.getByText('Uniswap')).toBeInTheDocument()
    // The CCA launchpad has no served logo, so the Uniswap mark stands in.
    expect(screen.queryByTestId(TestID.LaunchpadLogo)).toBeNull()
  })

  it.each<TokenDetailsAuctionSource>([
    { status: TokenDetailsSourceState.Loading },
    { status: TokenDetailsSourceState.NotFound },
    { status: TokenDetailsSourceState.Disabled },
  ])('renders nothing when the auction source is $status', (auctionSource) => {
    mockStore(auctionSource)

    render(<HeaderLaunchpad />)

    expect(screen.queryByText('Uniswap')).toBeNull()
  })

  it('renders nothing while the provenance flag is off', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })

    render(<HeaderLaunchpad />)

    expect(screen.queryByText('Uniswap')).toBeNull()
  })
})
