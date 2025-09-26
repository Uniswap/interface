import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import ms from 'ms'
import {
  getQuickPollingInterval,
  QUICK_POLL_INITIAL_INTERVAL,
  QUICK_POLL_INITIAL_PHASE,
  QUICK_POLL_MAX_INTERVAL,
  QUICK_POLL_MEDIUM_INTERVAL,
  QUICK_POLL_MEDIUM_PHASE,
  usePollPendingOrders,
} from 'state/activity/polling/orders'
import * as hooks from 'state/transactions/hooks'
import { act, renderHook } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import type { Mock } from 'vitest'

vi.mock('state/transactions/hooks', async () => {
  const actual = await vi.importActual('state/transactions/hooks')
  return {
    ...actual,
    usePendingUniswapXOrders: vi.fn(),
  }
})

vi.mock('state/hooks', async () => {
  const actual = await vi.importActual('state/hooks')
  return {
    ...actual,
    useAppDispatch: () => vi.fn(),
  }
})

vi.mock('uniswap/src/features/transactions/slice', async () => {
  const actual = await vi.importActual('uniswap/src/features/transactions/slice')
  return {
    ...actual,
    updateTransaction: vi.fn((tx: any) => ({ type: 'transactions/updateTransaction', payload: tx })),
  }
})

vi.mock('hooks/useAccount', async () => {
  const actual = await vi.importActual('hooks/useAccount')
  return {
    ...actual,
    useAccount: () => {
      return {
        address: '0x123',
        isConnected: true,
        chainId: 1,
        status: 'connected',
      }
    },
  }
})

const mockL1Order: UniswapXOrderDetails = {
  routing: TradingApi.Routing.DUTCH_V2,
  orderHash: '0xa9dd6f05ad6d6c79bee654c31ede4d0d2392862711be0f3bc4a9124af24a6a19',
  status: TransactionStatus.Pending,
  id: '1',
  addedTime: 1686339087000, // from createdAt in openStatusResponse
  chainId: UniverseChainId.Mainnet,
  from: '0x80becb808bfade4143183e58d18f2080e84e57a1',
  transactionOriginType: TransactionOriginType.Internal,
  typeInfo: {
    isUniswapXOrder: true,
    type: TransactionType.Swap,
    inputCurrencyAmountRaw: '100000000',
    expectedOutputCurrencyAmountRaw: '91371770080538616664',
    minimumOutputCurrencyAmountRaw: '90914911230135923580',
    inputCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
    outputCurrencyId: currencyId(DAI),
    tradeType: TradeType.EXACT_INPUT,
  },
}

const mockL2Order: UniswapXOrderDetails = {
  ...mockL1Order,
  chainId: 10,
}

describe('getQuickPollingInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial interval (500ms) when order is less than 10s old', () => {
    const now = Date.now()
    const orderStartTime = now - ms('5s') // 5 seconds ago

    vi.setSystemTime(now)

    expect(getQuickPollingInterval(orderStartTime)).toBe(QUICK_POLL_INITIAL_INTERVAL)
  })

  it('returns medium interval (2s) when order is between 10s and 200s old', () => {
    const now = Date.now()
    const orderStartTime = now - ms('100s') // 100 seconds ago

    vi.setSystemTime(now)

    expect(getQuickPollingInterval(orderStartTime)).toBe(QUICK_POLL_MEDIUM_INTERVAL)
  })

  it('returns max interval (30s) when order is older than 200s', () => {
    const now = Date.now()
    const orderStartTime = now - ms('300s') // 300 seconds ago

    vi.setSystemTime(now)

    expect(getQuickPollingInterval(orderStartTime)).toBe(QUICK_POLL_MAX_INTERVAL)
  })

  it('handles edge cases at phase boundaries', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    // Test exactly at 10s (should return medium interval)
    expect(getQuickPollingInterval(now - QUICK_POLL_INITIAL_PHASE)).toBe(QUICK_POLL_MEDIUM_INTERVAL)

    // Test exactly at 200s (should return max interval)
    expect(getQuickPollingInterval(now - QUICK_POLL_MEDIUM_PHASE)).toBe(QUICK_POLL_MAX_INTERVAL)
  })
})

describe('useStandardPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should not poll when no orders exist', () => {
    const onActivityUpdate = vi.fn()
    vi.spyOn(hooks, 'usePendingUniswapXOrders').mockReturnValue([])

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should poll L1 orders with exponential backoff', async () => {
    const onActivityUpdate = vi.fn()
    vi.spyOn(hooks, 'usePendingUniswapXOrders').mockReturnValue([mockL1Order])
    const mockResponse = { orders: [{ orderHash: mockL1Order.orderHash, orderStatus: TradingApi.OrderStatus.OPEN }] }
    ;(global.fetch as Mock).mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }),
    )

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    // First poll at 2s
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Second poll at 3s (2s * 1.5)
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Third poll at 4.5s (3s * 1.5)
    await act(async () => {
      vi.advanceTimersByTime(4500)
    })
    expect(global.fetch).toHaveBeenCalledTimes(3)

    // Fourth poll at 6.75s (4.5s * 1.5)
    await act(async () => {
      vi.advanceTimersByTime(6750)
    })
    expect(global.fetch).toHaveBeenCalledTimes(4)
  })

  it('should stop polling when order is filled', async () => {
    const onActivityUpdate = vi.fn()
    const mockOrder = { ...mockL1Order }

    // Start with returning the open order
    vi.spyOn(hooks, 'usePendingUniswapXOrders').mockReturnValue([mockOrder])
    ;(global.fetch as Mock)
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              orders: [{ orderHash: mockOrder.orderHash, orderStatus: TradingApi.OrderStatus.OPEN }],
            }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              orders: [
                { orderHash: mockOrder.orderHash, orderStatus: TradingApi.OrderStatus.FILLED, txHash: '0xfilled123' },
              ],
            }),
        }),
      )

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    // After the second poll returns FILLED, update the mock to return no pending orders
    setTimeout(() => {
      vi.spyOn(hooks, 'usePendingUniswapXOrders').mockReturnValue([])
    }, 3500)

    // Mock the updateTransaction to avoid errors
    vi.mocked(updateTransaction).mockImplementation((tx: any) => ({
      type: 'transactions/updateTransaction',
      payload: tx,
    }))

    // First poll - order is open
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Second poll - order becomes filled
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Verify no more polling occurs
    await act(async () => {
      vi.advanceTimersByTime(4500)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('useQuickPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should not poll when no orders exist', () => {
    const onActivityUpdate = vi.fn()
    vi.spyOn(hooks, 'usePendingUniswapXOrders').mockReturnValue([])

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should poll L2 orders with quick polling intervals', async () => {
    const onActivityUpdate = vi.fn()
    const now = Date.now()
    vi.setSystemTime(now)

    const recentOrder = {
      ...mockL2Order,
      addedTime: now,
    }

    vi.spyOn(hooks, 'usePendingUniswapXOrders').mockReturnValue([recentOrder])
    ;(global.fetch as Mock).mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ orders: [{ ...recentOrder, orderStatus: TradingApi.OrderStatus.OPEN }] }),
      }),
    )

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    // Poll every 500ms for first 10 seconds
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(global.fetch).toHaveBeenCalledTimes(i + 1)
    }

    // After 10 seconds, poll every 2 seconds up to 200 seconds
    for (let i = 0; i < 95; i++) {
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })
      expect(global.fetch).toHaveBeenCalledTimes(20 + i + 1)
    }

    // After 200 seconds, poll every 30 seconds
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })
      expect(global.fetch).toHaveBeenCalledTimes(115 + i + 1)
    }
  })
})
