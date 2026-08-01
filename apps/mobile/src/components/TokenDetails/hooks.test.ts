import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { preloadedMobileState } from 'src/test/fixtures'
import { act, renderHook, waitFor } from 'src/test/test-utils'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import {
  portfolio,
  portfolioBalances,
  SAMPLE_CURRENCY_ID_1,
  SAMPLE_SEED_ADDRESS_1,
  tokenBalance,
  usdcArbitrumToken,
  usdcBaseToken,
} from 'uniswap/src/test/fixtures'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { portfolioBalancesById } from 'uniswap/src/utils/balances'
import type { MockedFunction } from 'vitest'

const mockedNavigation = {
  navigate: vi.fn(),
  canGoBack: vi.fn(),
  pop: vi.fn(),
  push: vi.fn(),
}

vi.mock('@react-navigation/native', async () => {
  const actualNav = await vi.importActual('@react-navigation/native')
  return {
    ...actualNav,
    useNavigation: () => mockedNavigation,
  }
})

vi.mock('uniswap/src/features/portfolio/balances/hooks', async () => {
  const actual = await vi.importActual('uniswap/src/features/portfolio/balances/hooks')
  return {
    ...actual,
    usePortfolioBalances: vi.fn(() => ({
      data: undefined,
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    })),
  }
})

const mockUsePortfolioBalances = usePortfolioBalances as MockedFunction<typeof usePortfolioBalances>

describe(useCrossChainBalances, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default state
    mockUsePortfolioBalances.mockReturnValue({
      data: undefined,
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    })
  })

  describe('currentChainBalance', () => {
    it('returns null if there are no balances for the specified currency', async () => {
      const { result } = renderHook(
        () =>
          useCrossChainBalances({
            evmAddress: SAMPLE_SEED_ADDRESS_1,
            currencyId: SAMPLE_CURRENCY_ID_1,
            crossChainTokens: null,
          }),
        {
          preloadedState: preloadedMobileState(),
        },
      )

      await act(() => undefined)

      expect(result.current).toEqual(
        expect.objectContaining({
          currentChainBalance: null,
        }),
      )
    })

    it('returns balance if there is at least one for the specified currency', async () => {
      const Portfolio = portfolio()
      const testPortfolioBalances = portfolioBalances({ portfolio: Portfolio })
      const currentChainBalance = testPortfolioBalances[0]!

      const portfolioBalancesByIdData = portfolioBalancesById(testPortfolioBalances)
      mockUsePortfolioBalances.mockReturnValue({
        data: portfolioBalancesByIdData,
        loading: false,
        isPending: false,
        isError: false,
        refetch: vi.fn(),
        error: undefined,
      })

      const { result } = renderHook(
        () =>
          useCrossChainBalances({
            evmAddress: SAMPLE_SEED_ADDRESS_1,
            currencyId: currentChainBalance.currencyInfo.currencyId,
            crossChainTokens: null,
          }),
        {
          preloadedState: preloadedMobileState(),
        },
      )

      await waitFor(() => {
        expect(result.current).toEqual(
          expect.objectContaining({
            currentChainBalance,
          }),
        )
      })
    })
  })

  describe('otherChainBalances', () => {
    it('returns null if there are no bridged currencies', async () => {
      const { result } = renderHook(
        () =>
          useCrossChainBalances({
            evmAddress: SAMPLE_SEED_ADDRESS_1,
            currencyId: SAMPLE_CURRENCY_ID_1,
            crossChainTokens: null,
          }),
        {
          preloadedState: preloadedMobileState(),
        },
      )

      await act(() => undefined)

      expect(result.current).toEqual(
        expect.objectContaining({
          otherChainBalances: null,
        }),
      )
    })

    it('does not include current chain balance in other chain balances', async () => {
      const tokenBalances = [tokenBalance({ token: usdcBaseToken() }), tokenBalance({ token: usdcArbitrumToken() })]

      const bridgeInfo = tokenBalances.map((balance) => ({
        chain: balance.token.chain,
        address: balance.token.address,
      }))
      const Portfolio = portfolio({ tokenBalances })
      const testPortfolioBalances = portfolioBalances({
        portfolio: Portfolio,
      })
      const [currentChainBalance, ...otherChainBalances] = testPortfolioBalances

      const portfolioBalancesByIdData = portfolioBalancesById(testPortfolioBalances)
      mockUsePortfolioBalances.mockReturnValue({
        data: portfolioBalancesByIdData,
        loading: false,
        isPending: false,
        isError: false,
        refetch: vi.fn(),
        error: undefined,
      })

      const { result } = renderHook(
        () =>
          useCrossChainBalances({
            evmAddress: SAMPLE_SEED_ADDRESS_1,
            currencyId: currentChainBalance!.currencyInfo.currencyId,
            crossChainTokens: bridgeInfo,
          }),
        {
          preloadedState: preloadedMobileState(),
        },
      )

      await waitFor(() => {
        expect(result.current).toEqual(expect.objectContaining({ currentChainBalance, otherChainBalances }))
      })
    })
  })
})

describe(useTokenDetailsNavigation, () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct result', () => {
    const { result } = renderHook(() => useTokenDetailsNavigation())

    expect(result.current).toEqual({
      preload: expect.any(Function),
      navigate: expect.any(Function),
      navigateWithPop: expect.any(Function),
    })
  })

  it('preloads token details when preload function is called', async () => {
    const { result } = renderHook(() => useTokenDetailsNavigation())

    await act(() => result.current.preload(SAMPLE_CURRENCY_ID_1))
    expect(result.current.preload).toBeDefined()
  })

  it('navigates to token details when navigate function is called', async () => {
    const { result } = renderHook(() => useTokenDetailsNavigation())

    await act(() => result.current.navigate(SAMPLE_CURRENCY_ID_1))

    expect(mockedNavigation.navigate).toHaveBeenCalledTimes(1)
    expect(mockedNavigation.navigate).toHaveBeenNthCalledWith(1, MobileScreens.TokenDetails, {
      currencyId: SAMPLE_CURRENCY_ID_1,
      isMultichainAsset: undefined,
    })
  })

  it('forwards the isMultichainAsset hint to the navigation params when provided', async () => {
    const { result } = renderHook(() => useTokenDetailsNavigation())

    await act(() => result.current.navigate(SAMPLE_CURRENCY_ID_1, { isMultichainAsset: true }))

    expect(mockedNavigation.navigate).toHaveBeenNthCalledWith(1, MobileScreens.TokenDetails, {
      currencyId: SAMPLE_CURRENCY_ID_1,
      isMultichainAsset: true,
    })
  })

  describe('navigationWithPop', () => {
    it('pops the last screen from the stack and navigates to token details if can go back', async () => {
      mockedNavigation.canGoBack.mockReturnValueOnce(true)
      const { result } = renderHook(() => useTokenDetailsNavigation())

      await act(() => result.current.navigateWithPop(SAMPLE_CURRENCY_ID_1))

      expect(mockedNavigation.pop).toHaveBeenCalledTimes(1)
      expect(mockedNavigation.push).toHaveBeenCalledTimes(1)
      expect(mockedNavigation.push).toHaveBeenNthCalledWith(1, MobileScreens.TokenDetails, {
        currencyId: SAMPLE_CURRENCY_ID_1,
        isMultichainAsset: undefined,
      })
    })

    it('pushes token details screen to the stack without popping if there is no previous screen', async () => {
      mockedNavigation.canGoBack.mockReturnValueOnce(false)
      const { result } = renderHook(() => useTokenDetailsNavigation())

      await act(() => result.current.navigateWithPop(SAMPLE_CURRENCY_ID_1))

      expect(mockedNavigation.pop).not.toHaveBeenCalled()
      expect(mockedNavigation.push).toHaveBeenCalledTimes(1)
      expect(mockedNavigation.push).toHaveBeenNthCalledWith(1, MobileScreens.TokenDetails, {
        currencyId: SAMPLE_CURRENCY_ID_1,
        isMultichainAsset: undefined,
      })
    })
  })
})
