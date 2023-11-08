import { renderHook } from '@testing-library/react'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET } from 'constants/tokens'
import { RouterPreference, TradeState } from 'state/routing/types'
import { usePreviewTrade } from 'state/routing/usePreviewTrade'
import { useRouterPreference } from 'state/user/hooks'
import { mocked } from 'test-utils/mocked'

import { useRoutingAPITrade } from '../state/routing/useRoutingAPITrade'
import useAutoRouterSupported from './useAutoRouterSupported'
import useDebounce from './useDebounce'
import { useDebouncedTrade } from './useDebouncedTrade'
import useIsWindowVisible from './useIsWindowVisible'

const USDCAmount = CurrencyAmount.fromRawAmount(USDC_MAINNET, '10000')
const DAIAmount = CurrencyAmount.fromRawAmount(DAI, '10000')

jest.mock('./useAutoRouterSupported')
jest.mock('./useDebounce')
jest.mock('./useIsWindowVisible')
jest.mock('state/routing/useRoutingAPITrade')
jest.mock('state/routing/usePreviewTrade')
jest.mock('state/user/hooks')

// helpers to set mock expectations
const expectRouterMock = (state: TradeState) => {
  mocked(useRoutingAPITrade).mockReturnValue({ state, trade: undefined })
  mocked(usePreviewTrade).mockReturnValue({ state, trade: undefined })
}

beforeEach(() => {
  // ignore debounced value
  mocked(useDebounce).mockImplementation((value) => value)

  mocked(useIsWindowVisible).mockReturnValue(true)
  mocked(useAutoRouterSupported).mockReturnValue(true)
  mocked(useRouterPreference).mockReturnValue([RouterPreference.API, () => undefined])
})

describe('#useBestV3Trade ExactIn', () => {
  it('does not compute routing api trade when window is not focused', async () => {
    mocked(useIsWindowVisible).mockReturnValue(false)
    expectRouterMock(TradeState.NO_ROUTE_FOUND)

    const { result } = renderHook(() => useDebouncedTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

    expect(useRoutingAPITrade).toHaveBeenCalledWith(
      /* skipFetch = */ true,
      TradeType.EXACT_INPUT,
      USDCAmount,
      DAI,
      RouterPreference.API,
      /* account = */ undefined,
      /* inputTax = */ undefined,
      /* outputTax = */ undefined
    )
    expect(result.current).toEqual({ state: TradeState.NO_ROUTE_FOUND, trade: undefined })
  })
})

describe('#useDebouncedTrade ExactOut', () => {
  it('does not compute routing api trade when window is not focused', () => {
    mocked(useIsWindowVisible).mockReturnValue(false)
    expectRouterMock(TradeState.NO_ROUTE_FOUND)

    const { result } = renderHook(() => useDebouncedTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))
    expect(useRoutingAPITrade).toHaveBeenCalledWith(
      /* skipFetch = */ true,
      TradeType.EXACT_OUTPUT,
      DAIAmount,
      USDC_MAINNET,
      RouterPreference.API,
      /* account = */ undefined,
      /* inputTax = */ undefined,
      /* outputTax = */ undefined
    )
    expect(result.current).toEqual({ state: TradeState.NO_ROUTE_FOUND, trade: undefined })
  })
})
