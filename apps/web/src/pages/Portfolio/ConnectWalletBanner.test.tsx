import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { PortfolioConnectWalletBanner } from '~/pages/Portfolio/ConnectWalletBanner'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: vi.fn(),
}))

vi.mock('~/pages/Portfolio/components/AnimatedStyledBanner/AnimatedStyledBanner', () => ({
  AnimatedStyledBanner: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animated-banner">{children}</div>
  ),
}))

describe('PortfolioConnectWalletBanner', () => {
  const mockOpen = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useAccountDrawer).mockReturnValue({
      open: mockOpen,
      close: vi.fn(),
      toggle: vi.fn(),
      isOpen: false,
    })
  })

  it('should render correctly', () => {
    const { container } = render(<PortfolioConnectWalletBanner />)
    expect(container).toMatchSnapshot()
  })

  it('should display connect button', () => {
    render(<PortfolioConnectWalletBanner />)
    expect(screen.getByRole('button', { name: /connect/i })).toBeVisible()
  })
})
