import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/features/accounts/store/hooks')>()
  return {
    ...actual,
    useActiveAddresses: vi.fn(),
  }
})

vi.mock('~/pages/Portfolio/Header/hooks/usePortfolioRoutes', () => ({
  usePortfolioRoutes: vi.fn(),
}))

const DEMO_WALLET_ADDRESS = '0x8796207d877194d97a2c360c041f13887896FC79'
const MOCK_SVM_ADDRESS = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'

describe('usePortfolioAddresses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('external wallet (highest priority)', () => {
    it('should return external EVM address when viewing external wallet', () => {
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        externalAddress: { address: SAMPLE_SEED_ADDRESS_2, platform: Platform.EVM },
        isExternalWallet: true,
        tab: 'overview' as any,
      })

      const { result } = renderHook(() => usePortfolioAddresses())

      expect(result.current).toEqual({
        evmAddress: SAMPLE_SEED_ADDRESS_2,
        svmAddress: undefined,
        isExternalWallet: true,
      })
    })

    it('should return external SVM address when viewing external SVM wallet', () => {
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        externalAddress: { address: MOCK_SVM_ADDRESS, platform: Platform.SVM },
        isExternalWallet: true,
        tab: 'overview' as any,
      })

      const { result } = renderHook(() => usePortfolioAddresses())

      expect(result.current).toEqual({
        evmAddress: undefined,
        svmAddress: MOCK_SVM_ADDRESS,
        isExternalWallet: true,
      })
    })

    it('should prioritize external wallet over connected wallet', () => {
      // User is connected but viewing someone else's wallet
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: MOCK_SVM_ADDRESS,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        externalAddress: { address: SAMPLE_SEED_ADDRESS_2, platform: Platform.EVM },
        isExternalWallet: true,
        tab: 'overview' as any,
      })

      const { result } = renderHook(() => usePortfolioAddresses())

      expect(result.current).toEqual({
        evmAddress: SAMPLE_SEED_ADDRESS_2,
        svmAddress: undefined,
        isExternalWallet: true,
      })
    })
  })

  describe('connected wallet (second priority)', () => {
    it('should return connected EVM address when connected', () => {
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        externalAddress: undefined,
        isExternalWallet: false,
        tab: 'overview' as any,
      })

      const { result } = renderHook(() => usePortfolioAddresses())

      expect(result.current).toEqual({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
        isExternalWallet: false,
      })
    })

    it('should return connected SVM address when connected', () => {
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: undefined,
        svmAddress: MOCK_SVM_ADDRESS,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        externalAddress: undefined,
        isExternalWallet: false,
        tab: 'overview' as any,
      })

      const { result } = renderHook(() => usePortfolioAddresses())

      expect(result.current).toEqual({
        evmAddress: undefined,
        svmAddress: MOCK_SVM_ADDRESS,
        isExternalWallet: false,
      })
    })

    it('should return both EVM and SVM addresses when both are connected', () => {
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: MOCK_SVM_ADDRESS,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        externalAddress: undefined,
        isExternalWallet: false,
        tab: 'overview' as any,
      })

      const { result } = renderHook(() => usePortfolioAddresses())

      expect(result.current).toEqual({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: MOCK_SVM_ADDRESS,
        isExternalWallet: false,
      })
    })
  })

  describe('demo wallet (fallback)', () => {
    it('should return demo address when not connected and not viewing external wallet', () => {
      mocked(useActiveAddresses).mockReturnValue({
        evmAddress: undefined,
        svmAddress: undefined,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        externalAddress: undefined,
        isExternalWallet: false,
        tab: 'overview' as any,
      })

      const { result } = renderHook(() => usePortfolioAddresses())

      expect(result.current).toEqual({
        evmAddress: DEMO_WALLET_ADDRESS,
        svmAddress: undefined,
        isExternalWallet: false,
      })
    })
  })
})
