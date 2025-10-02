import { NetworkStatus } from '@apollo/client'
import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { useActiveAddresses } from 'features/accounts/store/hooks'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'

vi.mock('features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(),
}))

// Mock the balances module with all exports
vi.mock('uniswap/src/features/dataApi/balances/balances', async () => {
  const actual = await vi.importActual('uniswap/src/features/dataApi/balances/balances')
  return {
    ...actual,
    usePortfolioBalances: vi.fn(() => ({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    })),
  }
})

describe('useTokenBalances', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Default mock for useActiveAddresses
    mocked(useActiveAddresses).mockReturnValue({
      evmAddress: '0x123',
      svmAddress: undefined,
    })

    // Default mock for usePortfolioBalances
    mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    })
  })

  it('should return empty balances when loading', () => {
    mocked(usePortfolioBalances).mockReturnValueOnce({
      data: undefined,
      loading: true,
      networkStatus: NetworkStatus.loading,
      refetch: vi.fn(),
      error: undefined,
    })

    const { loading, balanceList, balanceMap } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({})
    expect(loading).toEqual(true)
    expect(balanceList).toEqual([])
  })

  it('should return empty balances when user is not connected', () => {
    mocked(useActiveAddresses).mockReturnValueOnce({
      evmAddress: undefined,
      svmAddress: undefined,
    })
    mocked(usePortfolioBalances).mockReturnValueOnce({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    })

    const { loading, balanceList, balanceMap } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({})
    expect(loading).toEqual(false)
    expect(balanceList).toEqual([])
  })

  it('should return balance map when user is connected', () => {
    // Create a native currency object
    class MockNativeCurrency extends NativeCurrency {
      constructor() {
        super(1, 18, 'ETH', 'Ethereum')
      }

      get wrapped(): Token {
        return WETH
      }

      equals(other: any): boolean {
        return other.isNative && other.chainId === this.chainId
      }
    }
    const mockNativeCurrency = new MockNativeCurrency()

    const mockPortfolioBalances: Record<string, PortfolioBalance> = {
      [`1-${DAI.address}`]: {
        id: '1',
        cacheId: 'test-cache-id',
        quantity: 123,
        balanceUSD: 123,
        currencyInfo: {
          currencyId: `1-${DAI.address}`,
          currency: DAI,
          logoUrl: undefined,
          isSpam: false,
          safetyInfo: undefined,
          spamCode: undefined,
        },
        relativeChange24: undefined,
        isHidden: false,
      },
      '1-native': {
        id: '2',
        cacheId: 'test-cache-id-2',
        quantity: 123,
        balanceUSD: 123,
        currencyInfo: {
          currencyId: '1-native',
          currency: mockNativeCurrency,
          logoUrl: undefined,
          isSpam: false,
          safetyInfo: undefined,
          spamCode: undefined,
        },
        relativeChange24: undefined,
        isHidden: false,
      },
    }

    mocked(usePortfolioBalances).mockReturnValueOnce({
      data: mockPortfolioBalances,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    })

    const { balanceMap, loading } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({
      [`1-${normalizeTokenAddressForCache(DAI.address)}`]: {
        balance: 123,
        usdValue: 123,
      },
      '1-native': {
        balance: 123,
        usdValue: 123,
      },
    })
    expect(loading).toEqual(false)
  })

  it('should work with REST API', () => {
    const mockPortfolioBalances: Record<string, PortfolioBalance> = {
      [`1-${USDC.address}`]: {
        id: '3',
        cacheId: 'test-cache-id-3',
        quantity: 456,
        balanceUSD: 456,
        currencyInfo: {
          currencyId: `1-${USDC.address}`,
          currency: USDC,
          logoUrl: undefined,
          isSpam: false,
          safetyInfo: undefined,
          spamCode: undefined,
        },
        relativeChange24: undefined,
        isHidden: false,
      },
    }

    mocked(usePortfolioBalances).mockReturnValueOnce({
      data: mockPortfolioBalances,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    })

    const { balanceMap, loading } = renderHook(() => useTokenBalances()).result.current
    expect(balanceMap).toEqual({
      [`1-${normalizeTokenAddressForCache(USDC.address)}`]: {
        balance: 456,
        usdValue: 456,
      },
    })
    expect(loading).toEqual(false)
  })
})
