import { renderHook } from '@testing-library/react'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET } from 'constants/tokens'
import { RouterPreference } from 'state/routing/slice'
import { TradeState } from 'state/routing/types'
import { useClientSideRouter } from 'state/user/hooks'

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

const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>
const mockUseAutoRouterSupported = useAutoRouterSupported as jest.MockedFunction<typeof useAutoRouterSupported>
const mockUseIsWindowVisible = useIsWindowVisible as jest.MockedFunction<typeof useIsWindowVisible>

const mockUseRoutingAPITrade = useRoutingAPITrade as jest.MockedFunction<typeof useRoutingAPITrade>
const mockUseClientSideRouter = useClientSideRouter as jest.MockedFunction<typeof useClientSideRouter>
const mockUseClientSideV3Trade = useClientSideV3Trade as jest.MockedFunction<typeof useClientSideV3Trade>

// helpers to set mock expectations
const expectRouterMock = (state: TradeState) => {
  mockUseRoutingAPITrade.mockReturnValue({ state, trade: undefined })
}

const expectClientSideMock = (state: TradeState) => {
  mockUseClientSideV3Trade.mockReturnValue({ state, trade: undefined })
}

beforeEach(() => {
  // ignore debounced value
  mockUseDebounce.mockImplementation((value) => value)

  mockUseIsWindowVisible.mockReturnValue(true)
  mockUseAutoRouterSupported.mockReturnValue(true)
  mockUseClientSideRouter.mockReturnValue([true, () => undefined])
})

describe('#useBestV3Trade ExactIn', () => {
  it('does not compute routing api trade when routing API is not supported', async () => {
    mockUseAutoRouterSupported.mockReturnValue(false)
    expectRouterMock(TradeState.INVALID)
    expectClientSideMock(TradeState.VALID)

    const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

    expect(mockUseRoutingAPITrade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, DAI, RouterPreference.CLIENT)
    expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, USDCAmount, DAI)
    expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
  })

  it('does not compute routing api trade when window is not focused', async () => {
    mockUseIsWindowVisible.mockReturnValue(false)
    expectRouterMock(TradeState.NO_ROUTE_FOUND)
    expectClientSideMock(TradeState.VALID)

    const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

    expect(mockUseRoutingAPITrade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, DAI, RouterPreference.CLIENT)
    expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, USDCAmount, DAI)
    expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
  })

  describe('when routing api is in non-error state', () => {
    it('does not compute client side v3 trade if routing api is LOADING', () => {
      expectRouterMock(TradeState.LOADING)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.LOADING, trade: undefined })
    })

    it('does not compute client side v3 trade if routing api is VALID', () => {
      expectRouterMock(TradeState.VALID)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
    })

    it('does not compute client side v3 trade if routing api is SYNCING', () => {
      expectRouterMock(TradeState.SYNCING)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.SYNCING, trade: undefined })
    })
  })

  describe('when routing api is in error state', () => {
    it('does not compute client side v3 trade if routing api is INVALID', () => {
      expectRouterMock(TradeState.INVALID)
      expectClientSideMock(TradeState.VALID)

      renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
    })

    it('computes client side v3 trade if routing api is NO_ROUTE_FOUND', () => {
      expectRouterMock(TradeState.NO_ROUTE_FOUND)
      expectClientSideMock(TradeState.VALID)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, USDCAmount, DAI)
      expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
    })
  })
})

describe('#useBestV3Trade ExactOut', () => {
  it('does not compute routing api trade when routing API is not supported', () => {
    mockUseAutoRouterSupported.mockReturnValue(false)
    expectRouterMock(TradeState.INVALID)
    expectClientSideMock(TradeState.VALID)

    const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

    expect(mockUseRoutingAPITrade).toHaveBeenCalledWith(
      TradeType.EXACT_OUTPUT,
      undefined,
      USDC_MAINNET,
      RouterPreference.CLIENT
    )
    expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET)
    expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
  })

  it('does not compute routing api trade when window is not focused', () => {
    mockUseIsWindowVisible.mockReturnValue(false)
    expectRouterMock(TradeState.NO_ROUTE_FOUND)
    expectClientSideMock(TradeState.VALID)

    const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

    expect(mockUseRoutingAPITrade).toHaveBeenCalledWith(
      TradeType.EXACT_OUTPUT,
      undefined,
      USDC_MAINNET,
      RouterPreference.CLIENT
    )
    expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET)
    expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
  })
  describe('when routing api is in non-error state', () => {
    it('does not compute client side v3 trade if routing api is LOADING', () => {
      expectRouterMock(TradeState.LOADING)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.LOADING, trade: undefined })
    })

    it('does not compute client side v3 trade if routing api is VALID', () => {
      expectRouterMock(TradeState.VALID)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
    })

    it('does not compute client side v3 trade if routing api is SYNCING', () => {
      expectRouterMock(TradeState.SYNCING)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
      expect(result.current).toEqual({ state: TradeState.SYNCING, trade: undefined })
    })
  })

  describe('when routing api is in error state', () => {
    it('computes client side v3 trade if routing api is INVALID', () => {
      expectRouterMock(TradeState.INVALID)
      expectClientSideMock(TradeState.VALID)

      renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
    })

    it('computes client side v3 trade if routing api is NO_ROUTE_FOUND', () => {
      expectRouterMock(TradeState.NO_ROUTE_FOUND)
      expectClientSideMock(TradeState.VALID)

      const { result } = renderHook(() => useBestTrade(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, DAIAmount, USDC_MAINNET)
      expect(result.current).toEqual({ state: TradeState.VALID, trade: undefined })
    })
  })
})
