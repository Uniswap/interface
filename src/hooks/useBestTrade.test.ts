import { renderHook } from '@testing-library/react'
import { CurrencyAmount, TradeType } from '@thinkincoin-libs/sdk-core'
import { DAI, USDC_MAINNET } from 'constants/tokens'
import { RouterPreference } from 'state/routing/slice'
import { TradeState } from 'state/routing/types'
import { useRouterPreference } from 'state/user/hooks'
import { mocked } from 'test-utils/mocked'

import { useRoutingAPITrade } from '../state/routing/useRoutingAPITrade'
import useAutoRouterSupported from './useAutoRouterSupported'
import { useBestTrade } from './useBestTrade'
import { useClientSideV3Trade } from './useClientSideV3Trade'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'

const USDCAmount = CurrencyAmount.fromRawAmount(USDC_MAINNET, '10000')
const DAIAmount = CurrencyAmount.fromRawAmount(DAI, '10000')

jest.mock('./useAutoRouterSupported')
jest.mock('./useClientSideV3Trade')
jest.mock('./useDebounce')
jest.mock('./useIsWindowVisible')
jest.mock('state/routing/useRoutingAPITrade')
jest.mock('state/user/hooks')

// helpers to set mock expectations
const expectRouterMock = (state: TradeState) => {
  mocked(useRoutingAPITrade).mockReturnValue({ state, trade: undefined })
}

const expectClientSideMock = (state: TradeState) => {
  mocked(useClientSideV3Trade).mockReturnValue({ state, trade: undefined })
}

beforeEach(() => {
  // ignore debounced value
  mocked(useDebounce).mockImplementation((value) => value)

  mocked(useIsWindowVisible).mockReturnValue(true)
  mocked(useAutoRouterSupported).mockReturnValue(true)
  mocked(useRouterPreference).mockReturnValue([RouterPreference.CLIENT, () => undefined])
})

describe('#useBestV3Trade ExactIn', () => {
  it('does not compute routing api trade when routing API is not supported', async () => {
    mocked(useAutoRouterSupported).mockReturnValue(false)
    expectRouterMock(TradeState.INVALID)
    expectClientSideMock(TradeState.VALID)

    const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

    expect(useRoutingAPITrade).toHaveBeenCalledWith(
      TradeType.EXACT_INPUT,
      USDCAmount,
      DAI,
      RouterPreference.CLIENT,
      true // skipFetch
    )
    expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, USDCAmount, DAI)
    expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
  })

  it('does not compute routing api trade when window is not focused', async () => {
    mocked(useIsWindowVisible).mockReturnValue(false)
    expectRouterMock(TradeState.NO_ROUTE_FOUND)
    expectClientSideMock(TradeState.VALID)

    const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

    expect(useRoutingAPITrade).toHaveBeenCalledWith(
      TradeType.EXACT_INPUT,
      USDCAmount,
      DAI,
      RouterPreference.CLIENT,
      true // skipFetch
    )
    expect(result.current).toEqual({ state: TradeState.NO_ROUTE_FOUND, trade: undefined })
  })

  describe('when routing api is in non-error state', () => {
    it('does not compute client side v3 trade if routing api is LOADING', () => {
      expectRouterMock(TradeState.LOADING)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.LOADING, trade: undefined })
    })

    it('does not compute client side v3 trade if routing api is VALID', () => {
      expectRouterMock(TradeState.VALID)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
    })
  })

  describe('when routing api is in error state', () => {
    it('does not compute client side v3 trade if routing api is INVALID', () => {
      expectRouterMock(TradeState.INVALID)
      expectClientSideMock(TradeState.VALID)

      renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
    })

    it('computes client side v3 trade if routing api is NO_ROUTE_FOUND', () => {
      expectRouterMock(TradeState.NO_ROUTE_FOUND)
      expectClientSideMock(TradeState.VALID)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, USDCAmount, DAI)
      expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
    })
  })
})

describe('#useBestV3Trade ExactOut', () => {
  it('does not compute routing api trade when routing API is not supported', () => {
    mocked(useAutoRouterSupported).mockReturnValue(false)
    expectRouterMock(TradeState.INVALID)
    expectClientSideMock(TradeState.VALID)

    const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

    expect(useRoutingAPITrade).toHaveBeenCalledWith(
      TradeType.EXACT_OUTPUT,
      DAIAmount,
      USDC_MAINNET,
      RouterPreference.CLIENT,
      true // skipFetch
    )
    expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET)
    expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
  })

  it('does not compute routing api trade when window is not focused', () => {
    mocked(useIsWindowVisible).mockReturnValue(false)
    expectRouterMock(TradeState.NO_ROUTE_FOUND)
    expectClientSideMock(TradeState.VALID)

    const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

    expect(useRoutingAPITrade).toHaveBeenCalledWith(
      TradeType.EXACT_OUTPUT,
      DAIAmount,
      USDC_MAINNET,
      RouterPreference.CLIENT,
      true // skipFetch
    )
    expect(result.current).toEqual({ state: TradeState.NO_ROUTE_FOUND, trade: undefined })
  })
  describe('when routing api is in non-error state', () => {
    it('does not compute client side v3 trade if routing api is LOADING', () => {
      expectRouterMock(TradeState.LOADING)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.LOADING, trade: undefined })
    })

    it('does not compute client side v3 trade if routing api is VALID', () => {
      expectRouterMock(TradeState.VALID)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
    })
  })

  describe('when routing api is in error state', () => {
    it('computes client side v3 trade if routing api is INVALID', () => {
      expectRouterMock(TradeState.INVALID)
      expectClientSideMock(TradeState.VALID)

      renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
    })

    it('computes client side v3 trade if routing api is NO_ROUTE_FOUND', () => {
      expectRouterMock(TradeState.NO_ROUTE_FOUND)
      expectClientSideMock(TradeState.VALID)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(useClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET)
      expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
    })
  })
})
