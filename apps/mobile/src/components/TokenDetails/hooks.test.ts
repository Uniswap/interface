import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { preloadedMobileState } from 'src/test/fixtures'
import { act, renderHook, waitFor } from 'src/test/test-utils'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import {
  SAMPLE_CURRENCY_ID_1,
  SAMPLE_SEED_ADDRESS_1,
  portfolio,
  portfolioBalances,
  tokenBalance,
  usdcArbitrumToken,
  usdcBaseToken,
} from 'uniswap/src/test/fixtures'
import { queryResolvers } from 'uniswap/src/test/utils'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

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

describe(useCrossChainBalances, () => {
  describe('currentChainBalance', () => {
    it('returns null if there are no balances for the specified currency', async () => {
      const { result } = renderHook(
        () =>
          useCrossChainBalances({
            address: SAMPLE_SEED_ADDRESS_1,
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
      const currentChainBalance = portfolioBalances({ portfolio: Portfolio })[0]!
      const { resolvers } = queryResolvers({
        portfolios: () => [Portfolio],
      })
      const { result } = renderHook(
        () =>
          useCrossChainBalances({
            address: SAMPLE_SEED_ADDRESS_1,
            currencyId: currentChainBalance.currencyInfo.currencyId,
            crossChainTokens: null,
          }),
        {
          preloadedState: preloadedMobileState(),
          resolvers,
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
            address: SAMPLE_SEED_ADDRESS_1,
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
      const [currentChainBalance, ...otherChainBalances] = portfolioBalances({
        portfolio: Portfolio,
      })
      const { resolvers } = queryResolvers({
        portfolios: () => [Portfolio],
      })

      const { result } = renderHook(
        () =>
          useCrossChainBalances({
            address: SAMPLE_SEED_ADDRESS_1,
            currencyId: currentChainBalance!.currencyInfo.currencyId,
            crossChainTokens: bridgeInfo,
          }),
        {
          preloadedState: preloadedMobileState(),
          resolvers,
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
    const queryResolver = jest.fn()
    const { resolvers } = queryResolvers({
      token: queryResolver,
    })
    const { result } = renderHook(() => useTokenDetailsNavigation(), {
      resolvers,
    })

    await act(() => result.current.preload(SAMPLE_CURRENCY_ID_1))

    expect(queryResolver).toHaveBeenCalledTimes(1)
    expect(queryResolver.mock.calls[0][1]).toEqual(currencyIdToContractInput(SAMPLE_CURRENCY_ID_1))
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
