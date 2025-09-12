import { NetworkStatus } from '@apollo/client'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { preloadedMobileState } from 'src/test/fixtures'
import { act, renderHook, waitFor } from 'src/test/test-utils'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
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

const mockedNavigation = {
  navigate: jest.fn(),
  canGoBack: jest.fn(),
  pop: jest.fn(),
  push: jest.fn(),
}

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native')
  return {
    ...actualNav,
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    useNavigation: () => mockedNavigation,
  }
})

jest.mock('uniswap/src/features/dataApi/balances/balances', () => {
  const actual = jest.requireActual('uniswap/src/features/dataApi/balances/balances')
  const { NetworkStatus: MockNetworkStatus } = jest.requireActual('@apollo/client')
  return {
    ...actual,
    usePortfolioBalances: jest.fn(() => ({
      data: undefined,
      loading: false,
      networkStatus: MockNetworkStatus.ready,
      refetch: jest.fn(),
      error: undefined,
    })),
  }
})

const mockUsePortfolioBalances = usePortfolioBalances as jest.MockedFunction<typeof usePortfolioBalances>

describe(useCrossChainBalances, () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock to default state
    mockUsePortfolioBalances.mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: jest.fn(),
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
        networkStatus: NetworkStatus.ready,
        refetch: jest.fn(),
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
        networkStatus: NetworkStatus.ready,
        refetch: jest.fn(),
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
    jest.clearAllMocks()
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
      })
    })
  })
})
