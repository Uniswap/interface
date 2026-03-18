import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { PortfolioHeader } from '~/pages/Portfolio/Header/Header'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

const { mockUseActiveAddresses } = vi.hoisted(() => ({
  mockUseActiveAddresses: vi.fn(),
}))

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/features/accounts/store/hooks')>()
  return {
    ...actual,
    useActiveAddresses: mockUseActiveAddresses,
  }
})

// Header uses useShowDemoView, which imports from uniswap package; setupTests only mocks useConnectionStatus
vi.mock('uniswap/src/features/accounts/store/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/accounts/store/hooks')>()
  return {
    ...actual,
    useActiveAddresses: mockUseActiveAddresses,
  }
})

vi.mock('~/pages/Portfolio/Header/hooks/usePortfolioRoutes', () => ({
  usePortfolioRoutes: vi.fn(),
}))

vi.mock('~/hooks/useAppHeaderHeight', () => ({
  useAppHeaderHeight: vi.fn().mockReturnValue(72),
}))

vi.mock('~/pages/Portfolio/Header/useShouldHeaderBeCompact', () => ({
  useShouldHeaderBeCompact: vi.fn().mockReturnValue(false),
}))

vi.mock('~/pages/Portfolio/Header/PortfolioAddressDisplay/PortfolioAddressDisplay', () => ({
  PortfolioAddressDisplay: ({ isCompact }: { isCompact: boolean }) => (
    <div data-testid="address-display" data-compact={isCompact}>
      Address Display Mock
    </div>
  ),
}))

vi.mock('~/pages/Portfolio/Header/Tabs', () => ({
  PortfolioTabs: () => <div data-testid="portfolio-tabs">Portfolio Tabs Mock</div>,
}))

vi.mock('~/pages/Portfolio/Header/SharePortfolioButton', () => ({
  SharePortfolioButton: () => <div data-testid="share-button">Share Button Mock</div>,
}))

vi.mock('~/components/NetworkFilter/NetworkFilter', () => ({
  NetworkFilter: () => <div data-testid="network-filter">Network Filter Mock</div>,
}))

describe('PortfolioHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('connected user', () => {
    beforeEach(() => {
      mocked(mockUseActiveAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
      })
    })

    it('should render header for own wallet', () => {
      mocked(usePortfolioRoutes).mockReturnValue({
        tab: PortfolioTab.Overview,
        chainId: undefined,
        externalAddress: undefined,
        isExternalWallet: false,
      })

      const { container } = render(<PortfolioHeader />)
      expect(container).toMatchSnapshot()
    })

    it('should render header with scroll position', () => {
      mocked(usePortfolioRoutes).mockReturnValue({
        tab: PortfolioTab.Tokens,
        chainId: undefined,
        externalAddress: undefined,
        isExternalWallet: false,
      })

      const { container } = render(<PortfolioHeader scrollY={150} />)
      expect(container).toMatchSnapshot()
    })
  })

  describe('external wallet view', () => {
    it('should render header with share button for external wallet', () => {
      mocked(mockUseActiveAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        tab: PortfolioTab.Overview,
        chainId: undefined,
        externalAddress: { address: '0xAnotherAddress', platform: Platform.EVM },
        isExternalWallet: true,
      })

      const { container } = render(<PortfolioHeader />)
      expect(container).toMatchSnapshot()
    })
  })
})
