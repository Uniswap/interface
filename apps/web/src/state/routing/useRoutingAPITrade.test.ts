import { skipToken } from '@reduxjs/toolkit/query/react'
import { renderHook } from '@testing-library/react'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import ms from 'ms'
import { useGetQuoteQuery, useGetQuoteQueryState } from 'state/routing/slice'
import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference, URAQuoteType } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { currencyAddressForSwapQuote } from 'state/routing/utils'
import { useRouterPreference } from 'state/user/hooks'
import { ETH_MAINNET } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useIsMismatchAccountQuery } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { AVERAGE_L1_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'

const USDCAmount = CurrencyAmount.fromRawAmount(USDC_MAINNET, '10000')

vi.mock('hooks/useIsWindowVisible')
vi.mock('./slice', () => {
  return {
    useGetQuoteQuery: vi.fn(),
    useGetQuoteQueryState: vi.fn(),
  }
})
vi.mock('state/user/hooks')
vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(),
    useExperimentValue: vi.fn(),
    getFeatureFlag: vi.fn(),
  }
})
vi.mock('uniswap/src/features/smartWallet/mismatch/hooks', () => ({
  useIsMismatchAccountQuery: vi.fn(),
}))

beforeEach(() => {
  mocked(useIsWindowVisible).mockReturnValue(true)
  mocked(useRouterPreference).mockReturnValue([RouterPreference.API, () => undefined])
  // @ts-ignore we dont use the response from this hook in useRoutingAPITrade so fine to mock as undefined
  mocked(useGetQuoteQuery).mockReturnValue(undefined)
  mocked(useGetQuoteQueryState).mockReturnValue({
    refetch: vi.fn(),
    isError: false,
    data: undefined,
    error: false,
    currentData: undefined,
  })

  mocked(useIsMismatchAccountQuery).mockReturnValue({
    data: false,
    isLoading: false,
    isError: false,
  } as any)
})

const MOCK_ARGS: GetQuoteArgs = {
  account: undefined,
  amount: USDCAmount.quotient.toString(),
  tokenInAddress: currencyAddressForSwapQuote(USDCAmount.currency),
  tokenInChainId: USDCAmount.currency.chainId,
  tokenInDecimals: USDCAmount.currency.wrapped.decimals,
  tokenInSymbol: USDCAmount.currency.wrapped.symbol,
  tokenOutAddress: currencyAddressForSwapQuote(ETH_MAINNET),
  tokenOutChainId: ETH_MAINNET.wrapped.chainId,
  tokenOutDecimals: ETH_MAINNET.wrapped.decimals,
  tokenOutSymbol: ETH_MAINNET.wrapped.symbol,
  routerPreference: RouterPreference.API,
  tradeType: TradeType.EXACT_INPUT,
  needsWrapIfUniswapX: USDCAmount.currency.isNative,
  uniswapXForceSyntheticQuotes: false,
  sendPortionEnabled: true,
  protocolPreferences: undefined,
  routingType: URAQuoteType.DUTCH_V2,
}

describe('#useRoutingAPITrade ExactIn', () => {
  it('does not call routing api when window is not focused for quote requests', () => {
    mocked(useIsWindowVisible).mockReturnValue(false)

    const { result } = renderHook(() =>
      useRoutingAPITrade(false, TradeType.EXACT_INPUT, USDCAmount, ETH_MAINNET, RouterPreference.API),
    )

    expect(useGetQuoteQuery).toHaveBeenCalledWith(skipToken, {
      pollingInterval: AVERAGE_L1_BLOCK_TIME_MS,
      refetchOnMountOrArgChange: 2 * 60,
    })
    expect(result.current.trade).toEqual(undefined)
  })

  it('does call routing api when window is focused for quote requests', () => {
    mocked(useIsWindowVisible).mockReturnValue(true)

    renderHook(() => useRoutingAPITrade(false, TradeType.EXACT_INPUT, USDCAmount, ETH_MAINNET, RouterPreference.API))

    expect(useGetQuoteQuery).toHaveBeenCalledWith(MOCK_ARGS, {
      pollingInterval: AVERAGE_L1_BLOCK_TIME_MS,
      refetchOnMountOrArgChange: 2 * 60,
    })
  })
})

describe('#useRoutingAPITrade pricing', () => {
  it('does not call routing api when window is not focused for price requests', () => {
    mocked(useIsWindowVisible).mockReturnValue(false)

    const { result } = renderHook(() =>
      useRoutingAPITrade(false, TradeType.EXACT_INPUT, USDCAmount, ETH_MAINNET, INTERNAL_ROUTER_PREFERENCE_PRICE),
    )

    expect(useGetQuoteQuery).toHaveBeenCalledWith(skipToken, {
      pollingInterval: ms(`1m`),
      refetchOnMountOrArgChange: 2 * 60,
    })
    expect(result.current.trade).toEqual(undefined)
  })

  it('does call routing api when window is focused for pricing requests', () => {
    mocked(useIsWindowVisible).mockReturnValue(true)

    renderHook(() =>
      useRoutingAPITrade(false, TradeType.EXACT_INPUT, USDCAmount, ETH_MAINNET, INTERNAL_ROUTER_PREFERENCE_PRICE),
    )

    expect(useGetQuoteQuery).toHaveBeenCalledWith(
      { ...MOCK_ARGS, sendPortionEnabled: false, routerPreference: INTERNAL_ROUTER_PREFERENCE_PRICE },
      {
        pollingInterval: ms(`1m`),
        refetchOnMountOrArgChange: 2 * 60,
      },
    )
  })
})
