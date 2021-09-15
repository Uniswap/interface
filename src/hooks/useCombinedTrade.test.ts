import { renderHook } from '@testing-library/react-hooks'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { DAI, USDC } from 'constants/tokens'
import { V3TradeState } from 'state/routing/types'
import { useRoutingAPIEnabled } from 'state/user/hooks'
import { useRoutingAPITradeExactIn, useRoutingAPITradeExactOut } from '../state/routing/useRoutingAPITrade'
import { useV3TradeExactIn, useV3TradeExactOut } from './useCombinedV3Trade'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'
import { useClientV3TradeExactIn, useClientSideV3TradeExactOut } from './useClientSideV3Trade'

const USDCAmount = CurrencyAmount.fromRawAmount(USDC, '10000')
const DAIAmount = CurrencyAmount.fromRawAmount(DAI, '10000')

jest.mock('./useDebounce')
const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>

// mock modules containing hooks
jest.mock('state/routing/useRoutingAPITrade')
jest.mock('./useClientSideV3Trade')
jest.mock('state/user/hooks')
jest.mock('./useIsWindowVisible')

const mockUseRoutingAPIEnabled = useRoutingAPIEnabled as jest.MockedFunction<typeof useRoutingAPIEnabled>
const mockUseIsWindowVisible = useIsWindowVisible as jest.MockedFunction<typeof useIsWindowVisible>

// useRouterTrade mocks
const mockUseRoutingAPITradeExactIn = useRoutingAPITradeExactIn as jest.MockedFunction<typeof useRoutingAPITradeExactIn>
const mockUseRoutingAPITradeExactOut = useRoutingAPITradeExactOut as jest.MockedFunction<
  typeof useRoutingAPITradeExactOut
>

// useClientSideV3Trade mocks
const mockUseClientSideV3TradeExactIn = useClientV3TradeExactIn as jest.MockedFunction<typeof useClientV3TradeExactIn>
const mockUseClientSideV3TradeExactOut = useClientSideV3TradeExactOut as jest.MockedFunction<
  typeof useClientSideV3TradeExactOut
>

// helpers to set mock expectations
const expectRouterMock = (state: V3TradeState) => {
  mockUseRoutingAPITradeExactIn.mockReturnValue({ state, trade: null })
  mockUseRoutingAPITradeExactOut.mockReturnValue({ state, trade: null })
}

const expectClientSideMock = (state: V3TradeState) => {
  mockUseClientSideV3TradeExactIn.mockReturnValue({ state, trade: null })
  mockUseClientSideV3TradeExactOut.mockReturnValue({ state, trade: null })
}

beforeEach(() => {
  // ignore debounced value
  mockUseDebounce.mockImplementation((value) => value)

  mockUseIsWindowVisible.mockReturnValue(true)
  mockUseRoutingAPIEnabled.mockReturnValue(true)
})

describe('#useV3TradeExactIn', () => {
  it('does not compute routing api trade when routing API is disabled', () => {
    mockUseRoutingAPIEnabled.mockReturnValue(false)
    expectRouterMock(V3TradeState.INVALID)
    expectClientSideMock(V3TradeState.VALID)

    const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

    expect(mockUseRoutingAPITradeExactIn).toHaveBeenCalledWith(undefined, DAI)
    expect(mockUseClientSideV3TradeExactIn).toHaveBeenCalledWith(USDCAmount, DAI)
    expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
  })

  it('does not compute routing api trade when window is not focused', () => {
    mockUseIsWindowVisible.mockReturnValue(false)
    expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
    expectClientSideMock(V3TradeState.VALID)

    const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

    expect(mockUseRoutingAPITradeExactIn).toHaveBeenCalledWith(undefined, DAI)
    expect(mockUseClientSideV3TradeExactIn).toHaveBeenCalledWith(USDCAmount, DAI)
    expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
  })

  describe('when routing api is in non-error state', () => {
    it('does not compute client side v3 trade if routing api is LOADING', () => {
      expectRouterMock(V3TradeState.LOADING)

      const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseClientSideV3TradeExactIn).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.LOADING, trade: null })
    })

    it('does not compute client side v3 trade if routing api is VALID', () => {
      expectRouterMock(V3TradeState.VALID)

      const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseClientSideV3TradeExactIn).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })

    it('does not compute client side v3 trade if routing api is SYNCING', () => {
      expectRouterMock(V3TradeState.SYNCING)

      const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseClientSideV3TradeExactIn).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.SYNCING, trade: null })
    })
  })

  describe('when routing api is in error state', () => {
    it('does not compute client side v3 trade if routing api is INVALID', () => {
      expectRouterMock(V3TradeState.INVALID)
      expectClientSideMock(V3TradeState.VALID)

      renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseClientSideV3TradeExactIn).toHaveBeenCalledWith(undefined, undefined)
    })

    it('computes client side v3 trade if routing api is NO_ROUTE_FOUND', () => {
      expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
      expectClientSideMock(V3TradeState.VALID)

      const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseClientSideV3TradeExactIn).toHaveBeenCalledWith(USDCAmount, DAI)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })
  })
})

describe('#useV3TradeExactOut', () => {
  it('does not compute routing api trade when routing API is disabled', () => {
    mockUseRoutingAPIEnabled.mockReturnValue(false)
    expectRouterMock(V3TradeState.INVALID)
    expectClientSideMock(V3TradeState.VALID)

    const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

    expect(mockUseRoutingAPITradeExactOut).toHaveBeenCalledWith(undefined, DAIAmount)
    expect(mockUseClientSideV3TradeExactOut).toHaveBeenCalledWith(USDC, DAIAmount)
    expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
  })

  it('does not compute routing api trade when window is not focused', () => {
    mockUseIsWindowVisible.mockReturnValue(false)
    expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
    expectClientSideMock(V3TradeState.VALID)

    const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

    expect(mockUseRoutingAPITradeExactOut).toHaveBeenCalledWith(undefined, DAIAmount)
    expect(mockUseClientSideV3TradeExactOut).toHaveBeenCalledWith(USDC, DAIAmount)
    expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
  })
  describe('when routing api is in non-error state', () => {
    it('does not compute client side v3 trade if routing api is LOADING', () => {
      expectRouterMock(V3TradeState.LOADING)

      const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseClientSideV3TradeExactOut).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.LOADING, trade: null })
    })

    it('does not compute client side v3 trade if routing api is VALID', () => {
      expectRouterMock(V3TradeState.VALID)

      const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseClientSideV3TradeExactOut).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })

    it('does not compute client side v3 trade if routing api is SYNCING', () => {
      expectRouterMock(V3TradeState.SYNCING)

      const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseClientSideV3TradeExactOut).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.SYNCING, trade: null })
    })
  })

  describe('when routing api is in error state', () => {
    it('computes client side v3 trade if routing api is INVALID', () => {
      expectRouterMock(V3TradeState.INVALID)
      expectClientSideMock(V3TradeState.VALID)

      renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseClientSideV3TradeExactOut).toHaveBeenCalledWith(undefined, undefined)
    })

    it('computes client side v3 trade if routing api is NO_ROUTE_FOUND', () => {
      expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
      expectClientSideMock(V3TradeState.VALID)

      const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseClientSideV3TradeExactOut).toHaveBeenCalledWith(USDC, DAIAmount)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })
  })
})
