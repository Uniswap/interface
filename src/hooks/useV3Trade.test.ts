import { renderHook } from '@testing-library/react-hooks'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useLocalV3TradeExactIn, useLocalV3TradeExactOut } from './useLocalV3Trade'
import { useV3TradeExactIn, useV3TradeExactOut, V3TradeState } from './useV3Trade'
import { useRouterTradeExactIn, useRouterTradeExactOut } from '../state/routing/useRouterTrade'
import useDebounce from './useDebounce'

// test fixtures
const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const DAI = new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 6, 'DAI')

const USDCAmount = CurrencyAmount.fromRawAmount(USDC, '10000')
const DAIAmount = CurrencyAmount.fromRawAmount(DAI, '10000')

jest.mock('./useDebounce')
const mockedUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>

// mock modules containing hooks
jest.mock('../state/routing/useRouterTrade')
jest.mock('./useLocalV3Trade')

// useRouterTrade mocks
const mockUseRouterTradeExactIn = useRouterTradeExactIn as jest.MockedFunction<typeof useRouterTradeExactIn>
const mockUseRouterTradeExactOut = useRouterTradeExactOut as jest.MockedFunction<typeof useRouterTradeExactOut>

// useLocalV3Trade mocks
const mockUseLocalV3TradeExactIn = useLocalV3TradeExactIn as jest.MockedFunction<typeof useLocalV3TradeExactIn>
const mockUseLocalV3TradeExactOut = useLocalV3TradeExactOut as jest.MockedFunction<typeof useLocalV3TradeExactOut>

// helpers to set mock expectations
const expectRouterMock = (state: V3TradeState) => {
  mockUseRouterTradeExactIn.mockReturnValue({ state, trade: null })
  mockUseRouterTradeExactOut.mockReturnValue({ state, trade: null })
}

const expectLocalMock = (state: V3TradeState) => {
  mockUseLocalV3TradeExactIn.mockReturnValue({ state, trade: null })
  mockUseLocalV3TradeExactOut.mockReturnValue({ state, trade: null })
}

beforeEach(() => {
  // ignore debounced value
  mockedUseDebounce.mockImplementation((value) => value)
})

describe('#useV3TradeExactIn', () => {
  describe('when router trade is in non-error state', () => {
    it('does not compute local v3 trade if router trade is LOADING', () => {
      expectRouterMock(V3TradeState.LOADING)

      const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseLocalV3TradeExactIn).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.LOADING, trade: null })
    })

    it('does not compute local v3 trade if router trade is VALID', () => {
      expectRouterMock(V3TradeState.VALID)

      const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseLocalV3TradeExactIn).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })

    it('does not compute local v3 trade if router trade is SYNCING', () => {
      expectRouterMock(V3TradeState.SYNCING)

      const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseLocalV3TradeExactIn).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.SYNCING, trade: null })
    })
  })

  describe('when router trade is in error state', () => {
    it('does not compute local v3 trade if router trade is INVALID', () => {
      expectRouterMock(V3TradeState.INVALID)
      expectLocalMock(V3TradeState.VALID)

      renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseLocalV3TradeExactIn).toHaveBeenCalledWith(undefined, undefined)
    })

    it('computes local v3 trade if router trade is NO_ROUTE_FOUND', () => {
      expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
      expectLocalMock(V3TradeState.VALID)

      const { result } = renderHook(() => useV3TradeExactIn(USDCAmount, DAI))

      expect(mockUseLocalV3TradeExactIn).toHaveBeenCalledWith(USDCAmount, DAI)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })
  })
})

describe('#useV3TradeExactOut', () => {
  describe('when router trade is in non-error state', () => {
    it('does not compute local v3 trade if router trade is LOADING', () => {
      expectRouterMock(V3TradeState.LOADING)

      const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseLocalV3TradeExactOut).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.LOADING, trade: null })
    })

    it('does not compute local v3 trade if router trade is VALID', () => {
      expectRouterMock(V3TradeState.VALID)

      const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseLocalV3TradeExactOut).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })

    it('does not compute local v3 trade if router trade is SYNCING', () => {
      expectRouterMock(V3TradeState.SYNCING)

      const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseLocalV3TradeExactOut).toHaveBeenCalledWith(undefined, undefined)
      expect(result.current).toEqual({ state: V3TradeState.SYNCING, trade: null })
    })
  })

  describe('when router trade is in error state', () => {
    it('computes local v3 trade if router trade is INVALID', () => {
      expectRouterMock(V3TradeState.INVALID)
      expectLocalMock(V3TradeState.VALID)

      renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseLocalV3TradeExactOut).toHaveBeenCalledWith(undefined, undefined)
    })

    it('computes local v3 trade if router trade is NO_ROUTE_FOUND', () => {
      expectRouterMock(V3TradeState.NO_ROUTE_FOUND)
      expectLocalMock(V3TradeState.VALID)

      const { result } = renderHook(() => useV3TradeExactOut(USDC, DAIAmount))

      expect(mockUseLocalV3TradeExactOut).toHaveBeenCalledWith(USDC, DAIAmount)
      expect(result.current).toEqual({ state: V3TradeState.VALID, trade: null })
    })
  })
})
