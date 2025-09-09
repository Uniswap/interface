import { NetworkStatus } from '@apollo/client'
import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'

vi.mock('@web3-react/core', () => ({
  useWeb3React: vi.fn(() => ({ account: '0x123', chainId: 1 })),
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

// Mock the feature flag hook
vi.mock('uniswap/src/features/gating/hooks', async () => {
  const actual = await vi.importActual('uniswap/src/features/gating/hooks')
  return {
    ...actual,
    useFeatureFlag: vi.fn(() => false), // Default to GraphQL (false = REST disabled)
  }
})

describe('useTokenBalances', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Default mock for usePortfolioBalances
    mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    })

    // Default mock for useFeatureFlag - disable REST to use GraphQL
    mocked(useFeatureFlag).mockReturnValue(false)
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
    mocked(useWeb3React).mockReturnValueOnce({ account: undefined, chainId: undefined } as any)
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
      [`1-${DAI.address.toLowerCase()}`]: {
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

  it('should work with REST API when feature flag is enabled', () => {
    // Enable REST API
    mocked(useFeatureFlag).mockImplementation((flag) => {
      if (flag === FeatureFlags.GqlToRestBalances) {
        return true // Use REST
      }
      return false
    })

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
      [`1-${USDC.address.toLowerCase()}`]: {
        balance: 456,
        usdValue: 456,
      },
    })
    expect(loading).toEqual(false)
  })
})
