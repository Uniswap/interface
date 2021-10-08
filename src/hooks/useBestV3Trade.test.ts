import { renderHook } from '@testing-library/react-hooks'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { DAI, USDC } from 'constants/tokens'
import { V3TradeState } from 'state/routing/types'

import { useRoutingAPITrade } from '../state/routing/useRoutingAPITrade'
import useAutoRouterSupported from './useAutoRouterSupported'
import { useBestV3Trade } from './useBestV3Trade'
import { useClientSideV3Trade } from './useClientSideV3Trade'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'

const USDCAmount = CurrencyAmount.fromRawAmount(USDC, '10000')
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
const mockUseClientSideV3Trade = useClientSideV3Trade as jest.MockedFunction<typeof useClientSideV3Trade>

// helpers to set mock expectations
const expectRouterMock = (state: V3TradeState) => {
  mockUseRoutingAPITrade.mockReturnValue({ state, trade: null })
}

const expectClientSideMock = (state: V3TradeState) => {
  mockUseClientSideV3Trade.mockReturnValue({ state, trade: null })
}

beforeEach(() => {
  // ignore debounced value
  mockUseDebounce.mockImplementation((value) => value)

  mockUseIsWindowVisible.mockReturnValue(true)
  mockUseAutoRouterSupported.mockReturnValue(true)
})

describe('#useBestV3Trade ExactIn', () => {
  it('does not compute routing api trade when routing API is not supported', () => {
    mockUseAutoRouterSupported.mockReturnValue(false)
    expectRouterMock(V3TradeState.INVALID)
    expectClientSideMock(V3TradeState.VALID)

    const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_INPUT, USDCAmount, DAI))

    expect(mockUseRoutingAPITrade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, DAI)
    expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, USDCAmount, DAI)
    expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
  })

  it('does not compute routing api trade when window is not focused', () => {
    mockUseIsWindowVisible.mockReturnValue(false)
    expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
    expectClientSideMock(V3TradeState.VALID)

    const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_INPUT, USDCAmount, DAI))

    expect(mockUseRoutingAPITrade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, DAI)
    expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, USDCAmount, DAI)
    expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
  })

  describe('when routing api is in non-error state', () => {
    it('does not compute client side v3 trade if routing api is LOADING', () => {
      expectRouterMock(V3TradeState.LOADING)

      const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.LOADING, trade: null })
    })

    it('does not compute client side v3 trade if routing api is VALID', () => {
      expectRouterMock(V3TradeState.VALID)

      const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })

    it('does not compute client side v3 trade if routing api is SYNCING', () => {
      expectRouterMock(V3TradeState.SYNCING)

      const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.SYNCING, trade: null })
    })
  })

  describe('when routing api is in error state', () => {
    it('does not compute client side v3 trade if routing api is INVALID', () => {
      expectRouterMock(V3TradeState.INVALID)
      expectClientSideMock(V3TradeState.VALID)

      renderHook(() => useBestV3Trade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, undefined, undefined)
    })

    it('computes client side v3 trade if routing api is NO_ROUTE_FOUND', () => {
      expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
      expectClientSideMock(V3TradeState.VALID)

      const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_INPUT, USDCAmount, DAI))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_INPUT, USDCAmount, DAI)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })
  })
})

describe('#useBestV3Trade ExactOut', () => {
  it('does not compute routing api trade when routing API is not supported', () => {
    mockUseAutoRouterSupported.mockReturnValue(false)
    expectRouterMock(V3TradeState.INVALID)
    expectClientSideMock(V3TradeState.VALID)

    const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_OUTPUT, DAIAmount, USDC))

    expect(mockUseRoutingAPITrade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, USDC)
    expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, DAIAmount, USDC)
    expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
  })

  it('does not compute routing api trade when window is not focused', () => {
    mockUseIsWindowVisible.mockReturnValue(false)
    expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
    expectClientSideMock(V3TradeState.VALID)

    const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_OUTPUT, DAIAmount, USDC))

    expect(mockUseRoutingAPITrade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, USDC)
    expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, DAIAmount, USDC)
    expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
  })
  describe('when routing api is in non-error state', () => {
    it('does not compute client side v3 trade if routing api is LOADING', () => {
      expectRouterMock(V3TradeState.LOADING)

      const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_OUTPUT, DAIAmount, USDC))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.LOADING, trade: null })
    })

    it('does not compute client side v3 trade if routing api is VALID', () => {
      expectRouterMock(V3TradeState.VALID)

      const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_OUTPUT, DAIAmount, USDC))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })

    it('does not compute client side v3 trade if routing api is SYNCING', () => {
      expectRouterMock(V3TradeState.SYNCING)

      const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_OUTPUT, DAIAmount, USDC))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.SYNCING, trade: null })
    })
  })

  describe('when routing api is in error state', () => {
    it('computes client side v3 trade if routing api is INVALID', () => {
      expectRouterMock(V3TradeState.INVALID)
      expectClientSideMock(V3TradeState.VALID)

      renderHook(() => useBestV3Trade(TradeType.EXACT_OUTPUT, DAIAmount, USDC))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, undefined, undefined)
    })

    it('computes client side v3 trade if routing api is NO_ROUTE_FOUND', () => {
      expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
      expectClientSideMock(V3TradeState.VALID)

      const { result } = renderHook(() => useBestV3Trade(TradeType.EXACT_OUTPUT, DAIAmount, USDC))

      expect(mockUseClientSideV3Trade).toHaveBeenCalledWith(TradeType.EXACT_OUTPUT, DAIAmount, USDC)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })
  })
})
