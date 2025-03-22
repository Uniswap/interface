import { TradeType } from '@uniswap/sdk-core'
import ms from 'ms'
import {
  QUICK_POLL_INITIAL_INTERVAL,
  QUICK_POLL_INITIAL_PHASE,
  QUICK_POLL_MAX_INTERVAL,
  QUICK_POLL_MEDIUM_INTERVAL,
  QUICK_POLL_MEDIUM_PHASE,
  getQuickPollingInterval,
  usePollPendingOrders,
} from 'state/activity/polling/orders'
import * as hooks from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { TransactionType } from 'state/transactions/types'
import { act, renderHook } from 'test-utils/render'
import { UniswapXOrderStatus } from 'types/uniswapx'

jest.mock('state/signatures/hooks', () => ({
  ...jest.requireActual('state/signatures/hooks'),
  usePendingOrders: jest.fn(),
}))

jest.mock('hooks/useAccount', () => {
  return {
    ...jest.requireActual('hooks/useAccount'),
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
  type: SignatureType.SIGN_UNISWAPX_ORDER,
  orderHash: '0xa9dd6f05ad6d6c79bee654c31ede4d0d2392862711be0f3bc4a9124af24a6a19',
  status: UniswapXOrderStatus.OPEN,
  id: '1',
  addedTime: 1686339087000, // from createdAt in openStatusResponse
  chainId: 1,
  offerer: '0x80becb808bfade4143183e58d18f2080e84e57a1',
  swapInfo: {
    isUniswapXOrder: true,
    type: TransactionType.SWAP,
    inputCurrencyAmountRaw: '100000000',
    expectedOutputCurrencyAmountRaw: '91371770080538616664',
    minimumOutputCurrencyAmountRaw: '90914911230135923580',
    inputCurrencyId: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    outputCurrencyId: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    tradeType: TradeType.EXACT_INPUT,
  },
}

const mockL2Order: UniswapXOrderDetails = {
  ...mockL1Order,
  chainId: 10,
}

describe('getQuickPollingInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns initial interval (500ms) when order is less than 10s old', () => {
    const now = Date.now()
    const orderStartTime = now - ms('5s') // 5 seconds ago

    jest.setSystemTime(now)

    expect(getQuickPollingInterval(orderStartTime)).toBe(QUICK_POLL_INITIAL_INTERVAL)
  })

  it('returns medium interval (2s) when order is between 10s and 200s old', () => {
    const now = Date.now()
    const orderStartTime = now - ms('100s') // 100 seconds ago

    jest.setSystemTime(now)

    expect(getQuickPollingInterval(orderStartTime)).toBe(QUICK_POLL_MEDIUM_INTERVAL)
  })

  it('returns max interval (30s) when order is older than 200s', () => {
    const now = Date.now()
    const orderStartTime = now - ms('300s') // 300 seconds ago

    jest.setSystemTime(now)

    expect(getQuickPollingInterval(orderStartTime)).toBe(QUICK_POLL_MAX_INTERVAL)
  })

  it('handles edge cases at phase boundaries', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    // Test exactly at 10s (should return medium interval)
    expect(getQuickPollingInterval(now - QUICK_POLL_INITIAL_PHASE)).toBe(QUICK_POLL_MEDIUM_INTERVAL)

    // Test exactly at 200s (should return max interval)
    expect(getQuickPollingInterval(now - QUICK_POLL_MEDIUM_PHASE)).toBe(QUICK_POLL_MAX_INTERVAL)
  })
})

describe('useStandardPolling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('should not poll when no orders exist', () => {
    const onActivityUpdate = jest.fn()
    jest.spyOn(hooks, 'usePendingOrders').mockReturnValue([])

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should poll L1 orders with exponential backoff', async () => {
    const onActivityUpdate = jest.fn()
    jest.spyOn(hooks, 'usePendingOrders').mockReturnValue([mockL1Order])
    const mockResponse = { orders: [{ ...mockL1Order, orderStatus: UniswapXOrderStatus.OPEN }] }
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }),
    )

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    // First poll at 2s
    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Second poll at 3s (2s * 1.5)
    await act(async () => {
      jest.advanceTimersByTime(3000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Third poll at 4.5s (3s * 1.5)
    await act(async () => {
      jest.advanceTimersByTime(4500)
    })
    expect(global.fetch).toHaveBeenCalledTimes(3)

    // Fourth poll at 6.75s (4.5s * 1.5)
    await act(async () => {
      jest.advanceTimersByTime(6750)
    })
    expect(global.fetch).toHaveBeenCalledTimes(4)
  })

  it('should stop polling when order is filled', async () => {
    const onActivityUpdate = jest.fn()
    const mockOrder = { ...mockL1Order }

    // Start with returning the open order
    jest.spyOn(hooks, 'usePendingOrders').mockReturnValue([mockOrder])
    ;(global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              orders: [{ ...mockOrder, orderStatus: UniswapXOrderStatus.OPEN }],
            }),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              orders: [{ ...mockOrder, orderStatus: UniswapXOrderStatus.FILLED }],
            }),
        }),
      )

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    // After the second poll returns FILLED, update the mock to return no pending orders
    setTimeout(() => {
      jest.spyOn(hooks, 'usePendingOrders').mockReturnValue([])
    }, 3500)

    // First poll - order is open
    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Second poll - order becomes filled
    await act(async () => {
      jest.advanceTimersByTime(3000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Verify no more polling occurs
    await act(async () => {
      jest.advanceTimersByTime(4500)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('useQuickPolling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('should not poll when no orders exist', () => {
    const onActivityUpdate = jest.fn()
    jest.spyOn(hooks, 'usePendingOrders').mockReturnValue([])

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should poll L2 orders with quick polling intervals', async () => {
    const onActivityUpdate = jest.fn()
    const now = Date.now()
    jest.setSystemTime(now)

    const recentOrder = {
      ...mockL2Order,
      addedTime: now,
    }

    jest.spyOn(hooks, 'usePendingOrders').mockReturnValue([recentOrder])
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ orders: [{ ...recentOrder, orderStatus: 'open' }] }),
      }),
    )

    renderHook(() => usePollPendingOrders(onActivityUpdate))

    // Poll every 500ms for first 10 seconds
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        jest.advanceTimersByTime(500)
      })
      expect(global.fetch).toHaveBeenCalledTimes(i + 1)
    }

    // After 10 seconds, poll every 2 seconds up to 200 seconds
    for (let i = 0; i < 95; i++) {
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })
      expect(global.fetch).toHaveBeenCalledTimes(20 + i + 1)
    }

    // After 200 seconds, poll every 30 seconds
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        jest.advanceTimersByTime(30000)
      })
      expect(global.fetch).toHaveBeenCalledTimes(115 + i + 1)
    }
  })
})
