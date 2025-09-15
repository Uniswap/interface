import { hasEncodedOrder } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { useCancelMultipleOrdersCallback } from 'components/AccountDrawer/MiniPortfolio/Activity/utils/cancel'
import { ContractTransaction } from 'ethers/lib/ethers'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import useSelectChain from 'hooks/useSelectChain'
import { renderHookWithProviders } from 'test-utils/renderHookWithProviders'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import {
  TransactionOriginType,
  TransactionStatus,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

vi.mock('hooks/useAccount')
vi.mock('hooks/useEthersProvider')
vi.mock('hooks/useSelectChain')
vi.mock('uniswap/src/features/telemetry/send')
vi.mock('utilities/src/logger/logger')
vi.mock('utils/swapErrorToUserReadableMessage')
vi.mock('components/AccountDrawer/MiniPortfolio/Activity/utils', () => ({
  hasEncodedOrder: vi.fn(),
}))

// Mock the UniswapX SDK order parsing to avoid parsing errors with test data
vi.mock('@uniswap/uniswapx-sdk', () => ({
  CosignedV2DutchOrder: {
    parse: vi.fn(() => ({ info: { nonce: '123' } })),
  },
  CosignedV3DutchOrder: {
    parse: vi.fn(() => ({ info: { nonce: '123' } })),
  },
  CosignedPriorityOrder: {
    parse: vi.fn(() => ({ info: { nonce: '123' } })),
  },
  DutchOrder: {
    parse: vi.fn(() => ({ info: { nonce: '123' } })),
  },
  getCancelMultipleParams: vi.fn(() => [{ word: '0x123', mask: '0x456' }]),
}))

// Mock getContract to return a permit2 contract mock
const { mockInvalidateUnorderedNonces, mockGetContract } = vi.hoisted(() => {
  const mockInvalidateUnorderedNonces = vi.fn()
  const mockGetContract = vi.fn(() => ({
    invalidateUnorderedNonces: mockInvalidateUnorderedNonces,
  }))
  return { mockInvalidateUnorderedNonces, mockGetContract }
})

vi.mock('utilities/src/contracts/getContract', () => ({
  getContract: mockGetContract,
}))

const mockAccount = {
  address: '0x1234567890123456789012345678901234567890',
  chainId: UniverseChainId.Mainnet,
  status: 'connected',
}

const mockProvider = {
  getSigner: vi.fn(),
}

const mockSelectChain = vi.fn().mockResolvedValue(true)

const createMockOrder = (overrides?: Partial<UniswapXOrderDetails>): UniswapXOrderDetails => ({
  id: 'order-1',
  chainId: UniverseChainId.Mainnet,
  orderHash: '0xhash1',
  encodedOrder: '0xencodedOrder1',
  routing: Routing.DUTCH_V2,
  status: TransactionStatus.Pending,
  typeInfo: {
    type: 'order',
    orderStatus: 'open',
    inputTokenQuantity: '1000000',
    outputTokenQuantity: '2000000',
  } as any,
  from: mockAccount.address,
  addedTime: Date.now(),
  hash: '0xtxhash',
  transactionOriginType: TransactionOriginType.Internal,
  ...overrides,
})

describe('useCancelMultipleOrdersCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAccount).mockReturnValue(mockAccount as any)
    vi.mocked(useEthersWeb3Provider).mockReturnValue(mockProvider as any)
    vi.mocked(useSelectChain).mockReturnValue(mockSelectChain)
    vi.mocked(hasEncodedOrder).mockReturnValue(true)
    vi.mocked(logger.warn).mockImplementation(() => {})
    vi.mocked(logger.error).mockImplementation(() => {})
    vi.mocked(didUserReject).mockReturnValue(false)
    mockInvalidateUnorderedNonces.mockReset()
  })

  describe('validation', () => {
    it('should return undefined when no orders are provided', async () => {
      const { result } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(undefined))

      const callback = result.current
      const txs = await callback()

      expect(txs).toBeUndefined()
      expect(mockInvalidateUnorderedNonces).not.toHaveBeenCalled()
    })

    it('should return undefined for empty orders array', async () => {
      const { result } = renderHookWithProviders(() => useCancelMultipleOrdersCallback([]))

      const callback = result.current
      const txs = await callback()

      expect(txs).toBeUndefined()
      expect(mockInvalidateUnorderedNonces).not.toHaveBeenCalled()
    })

    it('should log warning and return undefined when orders are from different chains', async () => {
      const orders = [
        createMockOrder({ chainId: UniverseChainId.Mainnet }),
        createMockOrder({ chainId: UniverseChainId.Polygon, orderHash: '0xhash2' }),
      ]

      const { result } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      const callback = result.current
      const txs = await callback()

      expect(txs).toBeUndefined()
      expect(logger.warn).toHaveBeenCalledWith(
        'cancel.utils',
        'useCancelMultipleOrdersCallback',
        'Cannot cancel orders from different chains',
      )
      expect(mockInvalidateUnorderedNonces).not.toHaveBeenCalled()
    })

    it('should return undefined when no orders have required cancellation data', async () => {
      const orders = [createMockOrder({ encodedOrder: undefined }), createMockOrder({ orderHash: undefined })]
      vi.mocked(hasEncodedOrder).mockReturnValue(false)

      const { result } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      const callback = result.current
      const txs = await callback()

      expect(txs).toBeUndefined()
      expect(logger.warn).toHaveBeenCalledWith(
        'cancel.utils',
        'useCancelMultipleOrdersCallback',
        'No orders with required cancellation data found',
      )
      expect(mockInvalidateUnorderedNonces).not.toHaveBeenCalled()
    })
  })

  describe('successful cancellation', () => {
    it('should successfully cancel a single order', async () => {
      const order = createMockOrder()
      const mockTx: ContractTransaction = {
        hash: '0xtxhash',
        wait: vi.fn(),
      } as any

      mockInvalidateUnorderedNonces.mockResolvedValue(mockTx)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback([order]))

      // Add the transaction to the store first
      store.dispatch(addTransaction(order))

      const callback = result.current
      const txs = await callback()

      // Check analytics event was sent
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.UniswapXOrderCancelInitiated, {
        orders: ['0xhash1'],
      })

      // Check order status was updated to Cancelling
      const state = store.getState()
      const storedOrder = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[order.id]
      expect(storedOrder?.status).toBe(TransactionStatus.Cancelling)

      // Check cancellation was called with correct params
      expect(mockInvalidateUnorderedNonces).toHaveBeenCalledWith('0x123', '0x456')

      expect(txs).toEqual([mockTx])
    })

    it('should successfully cancel multiple orders', async () => {
      const orders = [
        createMockOrder({ id: 'order-1', orderHash: '0xhash1' }),
        createMockOrder({ id: 'order-2', orderHash: '0xhash2', encodedOrder: '0xencodedOrder2' }),
        createMockOrder({
          id: 'order-3',
          orderHash: '0xhash3',
          encodedOrder: '0xencodedOrder3',
          routing: Routing.DUTCH_V3,
        }),
      ]

      const mockTx: ContractTransaction = { hash: '0xtx1', wait: vi.fn() } as any

      mockInvalidateUnorderedNonces.mockResolvedValue(mockTx)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      // Add all transactions to the store first
      orders.forEach((order) => store.dispatch(addTransaction(order)))

      const callback = result.current
      const txs = await callback()

      // Check analytics event includes all order hashes
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.UniswapXOrderCancelInitiated, {
        orders: ['0xhash1', '0xhash2', '0xhash3'],
      })

      // Check all orders were marked as Cancelling
      const state = store.getState()
      orders.forEach((order) => {
        const storedOrder = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[order.id]
        expect(storedOrder?.status).toBe(TransactionStatus.Cancelling)
      })

      expect(txs).toEqual([mockTx])
    })

    it('should filter out orders without encodedOrder when processing', async () => {
      const orders = [
        createMockOrder({ id: 'order-1', orderHash: '0xhash1', encodedOrder: '0xencodedOrder1' }),
        createMockOrder({ id: 'order-2', orderHash: '0xhash2', encodedOrder: undefined }), // Missing encodedOrder
        createMockOrder({ id: 'order-3', orderHash: '0xhash3', encodedOrder: '0xencodedOrder3' }),
      ]

      // Mock hasEncodedOrder to return false for the second order
      vi.mocked(hasEncodedOrder).mockImplementation((order) => order.encodedOrder !== undefined)

      const mockTx: ContractTransaction = { hash: '0xtx1', wait: vi.fn() } as any
      mockInvalidateUnorderedNonces.mockResolvedValue(mockTx)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      // Add all transactions to the store first
      orders.forEach((order) => store.dispatch(addTransaction(order)))

      const callback = result.current
      const txs = await callback()

      // Only orders with encodedOrder should be processed
      expect(mockInvalidateUnorderedNonces).toHaveBeenCalledWith('0x123', '0x456')

      // Only orders with encodedOrder should be marked as Cancelling
      const state = store.getState()
      const storedOrder1 = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[orders[0].id]
      const storedOrder2 = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[orders[1].id]
      const storedOrder3 = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[orders[2].id]

      expect(storedOrder1?.status).toBe(TransactionStatus.Cancelling)
      expect(storedOrder2?.status).toBe(TransactionStatus.Pending) // Should not be updated
      expect(storedOrder3?.status).toBe(TransactionStatus.Cancelling)

      expect(txs).toEqual([mockTx])
    })
  })

  describe('error handling', () => {
    it('should revert order statuses when cancellation returns no transactions', async () => {
      const orders = [
        createMockOrder({ id: 'order-1', status: TransactionStatus.Pending }),
        createMockOrder({ id: 'order-2', orderHash: '0xhash2', status: TransactionStatus.Success }),
      ]

      // Mock getContract to return null to simulate no permit2 contract
      mockGetContract.mockReturnValueOnce(null as any)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      // Add all transactions to the store first
      orders.forEach((order) => store.dispatch(addTransaction(order)))

      const callback = result.current
      const txs = await callback()

      // Check orders were reverted to original status
      const state = store.getState()
      const storedOrder1 = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[orders[0].id]
      const storedOrder2 = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[orders[1].id]

      expect(storedOrder1?.status).toBe(TransactionStatus.Pending)
      expect(storedOrder2?.status).toBe(TransactionStatus.Success)

      expect(logger.warn).toHaveBeenCalledWith(
        'cancel.utils',
        'useCancelMultipleOrdersCallback',
        'Cancellation returned no transactions',
      )
      expect(txs).toBeUndefined()
    })

    it('should revert order statuses when cancellation returns empty array', async () => {
      const order = createMockOrder({ status: TransactionStatus.Pending })

      // Mock getContract to return null to simulate no permit2 contract
      mockGetContract.mockReturnValueOnce(null as any)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback([order]))

      // Add the transaction to the store first
      store.dispatch(addTransaction(order))

      const callback = result.current
      const txs = await callback()

      // Should revert to original status
      const state = store.getState()
      const storedOrder = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[order.id]
      expect(storedOrder?.status).toBe(TransactionStatus.Pending)

      expect(logger.warn).toHaveBeenCalled()
      expect(txs).toBeUndefined()
    })

    it('should revert order statuses and log error when cancellation throws', async () => {
      const order = createMockOrder({ status: TransactionStatus.Pending })
      const error = new Error('Transaction failed')

      mockInvalidateUnorderedNonces.mockRejectedValue(error)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback([order]))

      // Add the transaction to the store first
      store.dispatch(addTransaction(order))

      const callback = result.current
      const txs = await callback()

      // Should revert to original status
      const state = store.getState()
      const storedOrder = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[order.id]
      expect(storedOrder?.status).toBe(TransactionStatus.Pending)

      // When the permit2 call fails, cancelMultipleUniswapXOrders catches it and returns undefined
      // So we expect a warning about no transactions, not an error
      expect(logger.warn).toHaveBeenCalledWith(
        'cancel.utils',
        'useCancelMultipleOrdersCallback',
        'Cancellation returned no transactions',
      )
      expect(txs).toBeUndefined()
    })

    it('should not log error when user rejects transaction', async () => {
      const order = createMockOrder()
      const userRejectError = new Error('User rejected transaction')

      mockInvalidateUnorderedNonces.mockRejectedValue(userRejectError)
      vi.mocked(didUserReject).mockReturnValue(true)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback([order]))

      // Add the transaction to the store first
      store.dispatch(addTransaction(order))

      const callback = result.current
      const txs = await callback()

      // Should still revert status
      const state = store.getState()
      const storedOrder = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[order.id]
      expect(storedOrder?.status).toBe(TransactionStatus.Pending)

      // Should not log error for user rejection
      expect(logger.error).not.toHaveBeenCalled()
      expect(txs).toBeUndefined()
    })
  })

  describe('provider and chain handling', () => {
    it('should use correct chainId for provider initialization', async () => {
      const orders = [
        createMockOrder({ id: 'order-1', chainId: UniverseChainId.Polygon }),
        createMockOrder({ id: 'order-2', chainId: UniverseChainId.Polygon, orderHash: '0xhash2' }),
      ]

      const mockTx: ContractTransaction = { hash: '0xtx1', wait: vi.fn() } as any
      mockInvalidateUnorderedNonces.mockResolvedValue([mockTx])

      // Mock provider to return different instance for different chain
      const polygonProvider = { getSigner: vi.fn(), chainId: UniverseChainId.Polygon }
      vi.mocked(useEthersWeb3Provider).mockImplementation((params) => {
        return params?.chainId === UniverseChainId.Polygon ? (polygonProvider as any) : (mockProvider as any)
      })

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      orders.forEach((order) => store.dispatch(addTransaction(order)))

      const callback = result.current
      await callback()

      expect(mockInvalidateUnorderedNonces).toHaveBeenCalledWith('0x123', '0x456')
    })

    it('should handle different routing types correctly', async () => {
      const orders = [
        createMockOrder({ id: 'order-1', routing: Routing.DUTCH_V2, orderHash: '0xhash1' }),
        createMockOrder({
          id: 'order-2',
          routing: Routing.DUTCH_V3,
          orderHash: '0xhash2',
          encodedOrder: '0xencodedOrder2',
        }),
        createMockOrder({
          id: 'order-3',
          routing: Routing.PRIORITY,
          orderHash: '0xhash3',
          encodedOrder: '0xencodedOrder3',
        }),
      ]

      const mockTx: ContractTransaction = { hash: '0xtx1', wait: vi.fn() } as any
      mockInvalidateUnorderedNonces.mockResolvedValue([mockTx])

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      // Add all transactions to the store first
      orders.forEach((order) => store.dispatch(addTransaction(order)))

      const callback = result.current
      await callback()

      expect(mockInvalidateUnorderedNonces).toHaveBeenCalledWith('0x123', '0x456')
    })
  })

  describe('memoization and re-renders', () => {
    it('should memoize validation result', () => {
      const orders = [createMockOrder()]
      const { result, rerender } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      const callback1 = result.current

      // Re-render with same orders
      rerender()
      const callback2 = result.current

      // Callback should be the same reference if orders haven't changed
      expect(callback1).toBe(callback2)
    })

    it('should create new callback when orders change', () => {
      const orders1 = [createMockOrder({ orderHash: '0xhash1' })]
      const { result, rerender } = renderHookWithProviders(({ orders }) => useCancelMultipleOrdersCallback(orders), {
        initialProps: { orders: orders1 },
      })

      const callback1 = result.current

      // Re-render with different orders
      const orders2 = [createMockOrder({ orderHash: '0xhash2' })]
      rerender({ orders: orders2 })
      const callback2 = result.current

      // Callback should be different when orders change
      expect(callback1).not.toBe(callback2)
    })

    it('should handle undefined provider correctly', async () => {
      vi.mocked(useEthersWeb3Provider).mockReturnValue(undefined as any)

      const order = createMockOrder()
      mockInvalidateUnorderedNonces.mockResolvedValue(undefined)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback([order]))

      // Add the transaction to the store first
      store.dispatch(addTransaction(order))

      const callback = result.current
      const txs = await callback()

      // Should not call permit2 when provider is undefined
      expect(mockInvalidateUnorderedNonces).not.toHaveBeenCalled()

      expect(txs).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle orders with missing orderHash in analytics', async () => {
      const orders = [
        createMockOrder({ id: 'order-1', orderHash: '0xhash1' }),
        createMockOrder({ id: 'order-2', orderHash: undefined, encodedOrder: '0xencodedOrder2' }),
        createMockOrder({ id: 'order-3', orderHash: '0xhash3' }),
      ]

      // Mock to allow order without hash to pass validation
      vi.mocked(hasEncodedOrder).mockImplementation((order) => order.encodedOrder !== undefined)

      const mockTx: ContractTransaction = { hash: '0xtx1', wait: vi.fn() } as any
      mockInvalidateUnorderedNonces.mockResolvedValue([mockTx])

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      // Add all transactions to the store first
      orders.forEach((order) => store.dispatch(addTransaction(order)))

      const callback = result.current
      await callback()

      // Analytics should only include orders with hashes
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.UniswapXOrderCancelInitiated, {
        orders: ['0xhash1', '0xhash3'],
      })
    })

    it('should handle mixed order statuses correctly', async () => {
      const orders = [
        createMockOrder({ id: 'order-1', status: TransactionStatus.Pending, orderHash: '0xhash1' }),
        createMockOrder({
          id: 'order-2',
          status: TransactionStatus.Cancelling,
          orderHash: '0xhash2',
          encodedOrder: '0xencodedOrder2',
        }),
        createMockOrder({
          id: 'order-3',
          status: TransactionStatus.Success,
          orderHash: '0xhash3',
          encodedOrder: '0xencodedOrder3',
        }),
      ]

      // Mock getContract to return null to simulate no permit2 contract
      mockGetContract.mockReturnValueOnce(null as any)

      const { result, store } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      // Add all transactions to the store first
      orders.forEach((order) => store.dispatch(addTransaction(order)))

      const callback = result.current
      await callback()

      // All orders should be reverted to their original status
      const state = store.getState()
      const storedOrder1 = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[orders[0].id]
      const storedOrder2 = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[orders[1].id]
      const storedOrder3 = state.transactions[mockAccount.address]?.[UniverseChainId.Mainnet]?.[orders[2].id]

      expect(storedOrder1?.status).toBe(TransactionStatus.Pending)
      expect(storedOrder2?.status).toBe(TransactionStatus.Cancelling) // Already was Cancelling
      expect(storedOrder3?.status).toBe(TransactionStatus.Success)
    })

    it('should handle empty cancellation data array', async () => {
      const orders = [createMockOrder({ encodedOrder: undefined }), createMockOrder({ orderHash: undefined })]

      // All orders fail validation
      vi.mocked(hasEncodedOrder).mockReturnValue(false)

      const { result } = renderHookWithProviders(() => useCancelMultipleOrdersCallback(orders))

      const callback = result.current
      const txs = await callback()

      expect(txs).toBeUndefined()
      expect(mockInvalidateUnorderedNonces).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        'cancel.utils',
        'useCancelMultipleOrdersCallback',
        'No orders with required cancellation data found',
      )
    })
  })
})
