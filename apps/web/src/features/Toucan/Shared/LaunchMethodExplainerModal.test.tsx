import { TestID } from '@universe/test'
import { AuctionLaunchMethod } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { LaunchMethodExplainerModal } from '~/features/Toucan/Shared/LaunchMethodExplainerModal'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

describe('LaunchMethodExplainerModal', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders the Custom auction copy', () => {
    render(<LaunchMethodExplainerModal method={AuctionLaunchMethod.Custom} isOpen onClose={vi.fn()} />)

    expect(screen.getByText('Custom Auctions')).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
  })

  it('explains Crowd Launch with the green Droplet and only a Close button', () => {
    render(<LaunchMethodExplainerModal method={AuctionLaunchMethod.Crowd} isOpen onClose={vi.fn()} />)

    expect(screen.getByText('Crowd Launches')).toBeInTheDocument()
    const droplet = screen.getByTestId(TestID.LaunchMethodExplainerTile).querySelector<SVGElement>('svg')
    expect(droplet?.style.color).toBe('rgb(90, 197, 59)')
    expect(
      screen.getByText(
        'Standardized launches that generate locked liquidity and fairly distribute tokens through pre-launch crowdfunding. Launched via Pools.xyz.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Learn more')).toBeNull()
    expect(screen.queryByText('Explore auctions')).toBeNull()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('explains Instant Launch with the blue Bolt and only a Close button', () => {
    render(<LaunchMethodExplainerModal method={AuctionLaunchMethod.Instant} isOpen onClose={vi.fn()} />)

    expect(screen.getByText('Instant Launches')).toBeInTheDocument()
    const bolt = screen.getByTestId(TestID.LaunchMethodExplainerTile).querySelector<SVGElement>('svg')
    expect(bolt?.style.color).toBe('rgb(35, 163, 255)')
    expect(
      screen.getByText(
        'Standardized launches that are immediately tradable. Priced using a bonding curve, with fees going into locked liquidity. Launched via Pools.xyz.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Learn more')).toBeNull()
    expect(screen.queryByText('Explore auctions')).toBeNull()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('renders nothing while closed', () => {
    render(<LaunchMethodExplainerModal method={AuctionLaunchMethod.Custom} isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByText('Custom Auctions')).toBeNull()
  })

  it('closes from the Close button and navigates to Explore auctions', () => {
    const onClose = vi.fn()
    render(<LaunchMethodExplainerModal method={AuctionLaunchMethod.Custom} isOpen onClose={onClose} />)

    fireEvent.click(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Explore auctions'))
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(mockNavigate).toHaveBeenCalledWith('/explore/auctions')
  })
})
