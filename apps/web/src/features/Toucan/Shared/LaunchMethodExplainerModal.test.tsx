import { TestID } from '@universe/test'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
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

  it('renders the Custom auction copy with its help article', () => {
    render(<LaunchMethodExplainerModal method={LaunchProvenanceMethod.CustomAuction} isOpen onClose={vi.fn()} />)

    expect(screen.getByText('Custom Auctions')).toBeInTheDocument()
    expect(screen.getByText('Learn more').closest('a')).toHaveAttribute('href', UniswapHelpUrls.articles.toucanIntro)
    expect(screen.getByText('Explore auctions')).toBeInTheDocument()
    expect(screen.getByText(/powered by Uniswap’s CCA protocol\.$/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'pools.xyz' })).toBeNull()
  })

  it('renders the Crowd Launch copy and pools.xyz link', () => {
    render(<LaunchMethodExplainerModal method={LaunchProvenanceMethod.CrowdLaunch} isOpen onClose={vi.fn()} />)

    expect(screen.getByText('Crowd Launches')).toBeInTheDocument()
    const droplet = screen.getByTestId(TestID.LaunchMethodExplainerTile).querySelector<SVGElement>('svg')
    expect(droplet?.style.color).toBe('rgb(90, 197, 59)')
    expect(screen.getByText(/pre-launch crowdfunding\. Launched via pools\.xyz\.$/)).toBeInTheDocument()
    const poolsLink = screen.getByRole('link', { name: 'pools.xyz' })
    expect(poolsLink).toHaveAttribute('href', 'https://pools.xyz')
    expect(poolsLink).toHaveAttribute('target', '_blank')
    expect(poolsLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: 'Learn more' })).toBeNull()
    expect(screen.queryByText('Explore auctions')).toBeNull()
  })

  it('renders the Instant Launch copy and pools.xyz link', () => {
    render(<LaunchMethodExplainerModal method={LaunchProvenanceMethod.InstantLaunch} isOpen onClose={vi.fn()} />)

    expect(screen.getByText('Instant Launches')).toBeInTheDocument()
    const bolt = screen.getByTestId(TestID.LaunchMethodExplainerTile).querySelector<SVGElement>('svg')
    expect(bolt?.style.color).toBe('rgb(35, 163, 255)')
    expect(screen.getByText(/bonding curve.*Launched via pools\.xyz\.$/)).toBeInTheDocument()
    const poolsLink = screen.getByRole('link', { name: 'pools.xyz' })
    expect(poolsLink).toHaveAttribute('href', 'https://pools.xyz')
    expect(poolsLink).toHaveAttribute('target', '_blank')
    expect(poolsLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: 'Learn more' })).toBeNull()
    expect(screen.queryByText('Explore auctions')).toBeNull()
  })

  it('renders nothing for methods without an explainer', () => {
    for (const method of [LaunchProvenanceMethod.ThirdParty, LaunchProvenanceMethod.Unknown]) {
      const { unmount } = render(<LaunchMethodExplainerModal method={method} isOpen onClose={vi.fn()} />)
      expect(screen.queryByTestId(TestID.LaunchMethodExplainerModal)).toBeNull()
      unmount()
    }
  })

  it('renders nothing while closed', () => {
    render(
      <LaunchMethodExplainerModal method={LaunchProvenanceMethod.CustomAuction} isOpen={false} onClose={vi.fn()} />,
    )

    expect(screen.queryByText('Custom Auctions')).toBeNull()
  })

  it('closes from the Close button and navigates to Explore auctions', () => {
    const onClose = vi.fn()
    render(<LaunchMethodExplainerModal method={LaunchProvenanceMethod.CustomAuction} isOpen onClose={onClose} />)

    fireEvent.click(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Explore auctions'))
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(mockNavigate).toHaveBeenCalledWith('/explore/auctions')
  })
})
