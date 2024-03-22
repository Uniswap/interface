import { skipToken } from '@reduxjs/toolkit/query/react'
import { renderHook } from '@testing-library/react'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import { USDC_MAINNET } from 'constants/tokens'
import { useUniswapXSyntheticQuoteEnabled } from 'featureFlags/flags/uniswapXUseSyntheticQuote'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import ms from 'ms'
import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference } from 'state/routing/types'
import { useRouterPreference } from 'state/user/hooks'
import { ETH_MAINNET } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'

import { useGetQuoteQuery, useGetQuoteQueryState } from './slice'
import { useRoutingAPITrade } from './useRoutingAPITrade'
import { currencyAddressForSwapQuote } from './utils'

const USDCAmount = CurrencyAmount.fromRawAmount(USDC_MAINNET, '10000')

jest.mock('hooks/useIsWindowVisible')
jest.mock('state/routing/usePreviewTrade')
jest.mock('./slice', () => {
  return {
    useGetQuoteQuery: jest.fn(),
    useGetQuoteQueryState: jest.fn(),
  }
})
jest.mock('state/user/hooks')
jest.mock('featureFlags/flags/uniswapXUseSyntheticQuote')

beforeEach(() => {
  mocked(useIsWindowVisible).mockReturnValue(true)
  mocked(useRouterPreference).mockReturnValue([RouterPreference.API, () => undefined])
  mocked(useUniswapXSyntheticQuoteEnabled).mockReturnValue(false)
  // @ts-ignore we dont use the response from this hook in useRoutingAPITrade so fine to mock as undefined
  mocked(useGetQuoteQuery).mockReturnValue(undefined)
  mocked(useGetQuoteQueryState).mockReturnValue({
    refetch: jest.fn(),
    isError: false,
    data: undefined,
    error: false,
    currentData: undefined,
  })
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
  gatewayDNSUpdateEnabled: false,
}

describe('#useRoutingAPITrade ExactIn', () => {
  it('does not call routing api when window is not focused for quote requests', () => {
    mocked(useIsWindowVisible).mockReturnValue(false)

    const { result } = renderHook(() =>
      useRoutingAPITrade(false, TradeType.EXACT_INPUT, USDCAmount, ETH_MAINNET, RouterPreference.API)
    )

    expect(useGetQuoteQuery).toHaveBeenCalledWith(skipToken, {
      pollingInterval: AVERAGE_L1_BLOCK_TIME,
      refetchOnMountOrArgChange: 2 * 60,
    })
    expect(result.current?.trade).toEqual(undefined)
  })

  it('does call routing api when window is focused for quote requests', () => {
    mocked(useIsWindowVisible).mockReturnValue(true)

    renderHook(() => useRoutingAPITrade(false, TradeType.EXACT_INPUT, USDCAmount, ETH_MAINNET, RouterPreference.API))

    expect(useGetQuoteQuery).toHaveBeenCalledWith(MOCK_ARGS, {
      pollingInterval: AVERAGE_L1_BLOCK_TIME,
      refetchOnMountOrArgChange: 2 * 60,
    })
  })
})

describe('#useRoutingAPITrade pricing', () => {
  it('does not call routing api when window is not focused for price requests', () => {
    mocked(useIsWindowVisible).mockReturnValue(false)

    const { result } = renderHook(() =>
      useRoutingAPITrade(false, TradeType.EXACT_INPUT, USDCAmount, ETH_MAINNET, INTERNAL_ROUTER_PREFERENCE_PRICE)
    )

    expect(useGetQuoteQuery).toHaveBeenCalledWith(skipToken, {
      pollingInterval: ms(`1m`),
      refetchOnMountOrArgChange: 2 * 60,
    })
    expect(result.current?.trade).toEqual(undefined)
  })

  it('does call routing api when window is focused for pricing requests', () => {
    mocked(useIsWindowVisible).mockReturnValue(true)

    renderHook(() =>
      useRoutingAPITrade(false, TradeType.EXACT_INPUT, USDCAmount, ETH_MAINNET, INTERNAL_ROUTER_PREFERENCE_PRICE)
    )

    expect(useGetQuoteQuery).toHaveBeenCalledWith(
      { ...MOCK_ARGS, sendPortionEnabled: false, routerPreference: INTERNAL_ROUTER_PREFERENCE_PRICE },
      {
        pollingInterval: ms(`1m`),
        refetchOnMountOrArgChange: 2 * 60,
      }
    )
  })
})
