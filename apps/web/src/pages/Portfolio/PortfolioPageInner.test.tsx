import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioPageInner } from '~/pages/Portfolio/PortfolioPageInner'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/features/accounts/store/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/accounts/store/hooks')>()
  return {
    ...actual,
    useActiveAddresses: vi.fn(),
  }
})

vi.mock('~/pages/Portfolio/Header/hooks/usePortfolioRoutes', () => ({
  usePortfolioRoutes: vi.fn(),
}))

vi.mock('~/pages/Portfolio/Header/Header', () => ({
  PortfolioHeader: ({ scrollY }: { scrollY?: number }) => (
    <div data-testid="portfolio-header" data-scroll-y={scrollY}>
      Portfolio Header Mock
    </div>
  ),
}))

vi.mock('~/pages/Portfolio/PortfolioContent', () => ({
  PortfolioContent: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="portfolio-content" data-disabled={disabled}>
      Portfolio Content Mock
    </div>
  ),
}))

vi.mock('~/pages/Portfolio/ConnectWalletBanner', () => ({
  PortfolioConnectWalletBanner: () => <div data-testid="connect-wallet-banner">Connect Wallet Banner Mock</div>,
}))

vi.mock('~/pages/Portfolio/ConnectWalletFixedBottomButton', () => ({
  ConnectWalletFixedBottomButton: ({ shouldShow }: { shouldShow: boolean }) => (
    <div data-testid="connect-wallet-button" data-should-show={shouldShow}>
      Connect Wallet Button Mock
    </div>
  ),
}))

describe('PortfolioPageInner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('connected user view', () => {
    beforeEach(() => {
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        tab: PortfolioTab.Overview,
        externalAddress: undefined,
        isExternalWallet: false,
      })
    })

    it('should render correctly with banner visible', () => {
      const { container } = render(<PortfolioPageInner scrollY={0} isBannerVisible={true} />)
      expect(container).toMatchSnapshot()
    })

    it('should render correctly with banner hidden', () => {
      const { container } = render(<PortfolioPageInner scrollY={200} isBannerVisible={false} />)
      expect(container).toMatchSnapshot()
    })
  })

  describe('demo view (disconnected)', () => {
    beforeEach(() => {
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: undefined,
        svmAddress: undefined,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        tab: PortfolioTab.Overview,
        externalAddress: undefined,
        isExternalWallet: false,
      })
    })

    it('should render demo view with connect wallet banner', () => {
      const { container } = render(<PortfolioPageInner scrollY={0} isBannerVisible={true} />)
      expect(container).toMatchSnapshot()
    })

    it('should render demo view with bottom margin', () => {
      const { container } = render(<PortfolioPageInner scrollY={0} isBannerVisible={false} mb={100} />)
      expect(container).toMatchSnapshot()
    })
  })
})
