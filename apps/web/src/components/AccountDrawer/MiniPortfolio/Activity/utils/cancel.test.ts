import { TradingApi } from '@universe/api'
import { useCancelMultipleOrdersCallback } from 'components/AccountDrawer/MiniPortfolio/Activity/utils/cancel'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useFetchLimitOrders } from 'hooks/useFetchLimitOrders'
import useSelectChain from 'hooks/useSelectChain'
import { renderHook } from 'test-utils/render'
import { createMockUniswapXOrder } from 'test-utils/transactions/fixtures'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  cancelMultipleUniswapXOrders,
  extractCancellationData,
  fetchLimitOrdersEncodedOrderData,
  getOrdersMatchingCancellationData,
} from 'uniswap/src/features/transactions/cancel/cancelMultipleOrders'
import { validateOrdersForCancellation } from 'uniswap/src/features/transactions/cancel/validation'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { createPermit2ContractForChain } from 'uniswap/src/features/transactions/utils/permit2'
import { vi } from 'vitest'

vi.mock('hooks/useAccount')
vi.mock('hooks/useEthersProvider')
vi.mock('hooks/useSelectChain')
vi.mock('hooks/useFetchLimitOrders')
vi.mock('uniswap/src/features/transactions/cancel/validation')
vi.mock('uniswap/src/features/transactions/utils/permit2')
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('uniswap/src/features/transactions/cancel/cancelMultipleOrders', () => ({
  cancelMultipleUniswapXOrders: vi.fn(),
  trackOrderCancellation: vi.fn(),
  extractCancellationData: vi.fn(),
  getOrdersMatchingCancellationData: vi.fn(),
  fetchLimitOrdersEncodedOrderData: vi.fn(),
}))

vi.mock('state/hooks', async () => {
  const actual = await vi.importActual<typeof import('state/hooks')>('state/hooks')
  return {
    ...actual,
    useAppDispatch: () => vi.fn(),
  }
})

const createMockOrder = (overrides?: Partial<UniswapXOrderDetails>): UniswapXOrderDetails =>
  createMockUniswapXOrder(overrides)

describe('useCancelMultipleOrdersCallback', () => {
  const mockProvider = {
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn().mockResolvedValue('mock-client-version'),
  } as any
  const mockSelectChain = vi.fn()
  const mockPermit2 = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAccount as any).mockReturnValue({ address: '0x1234567890123456789012345678901234567890' })
    ;(useEthersWeb3Provider as any).mockReturnValue(mockProvider)
    ;(useSelectChain as any).mockReturnValue(mockSelectChain)
    ;(createPermit2ContractForChain as any).mockReturnValue(mockPermit2)
    ;(useFetchLimitOrders as any).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue([]),
    })

    // Set default mock behavior for the imported functions
    ;(extractCancellationData as any).mockImplementation((orders: any[]) =>
      orders
        .filter((o: any) => o.encodedOrder && o.orderHash)
        .map((o: any) => ({
          orderHash: o.orderHash,
          encodedOrder: o.encodedOrder,
          routing: o.routing,
        })),
    )
    ;(getOrdersMatchingCancellationData as any).mockImplementation((orders: any[], cancellationData: any[]) =>
      orders.filter((o: any) => cancellationData.some((c: any) => c.orderHash === o.orderHash)),
    )
    ;(fetchLimitOrdersEncodedOrderData as any).mockResolvedValue([])
  })

  it('should return undefined when no orders provided', async () => {
    ;(validateOrdersForCancellation as any).mockReturnValue({ error: null })

    const { result } = renderHook(() => useCancelMultipleOrdersCallback(undefined))
    const callback = result.current

    const txs = await callback()
    expect(txs).toBeUndefined()
  })

  it('should return undefined when validation fails', async () => {
    const orders = [createMockOrder()]
    ;(validateOrdersForCancellation as any).mockReturnValue({ error: new Error('Validation failed') })

    const { result } = renderHook(() => useCancelMultipleOrdersCallback(orders))
    const callback = result.current

    const txs = await callback()
    expect(txs).toBeUndefined()
  })

  it('should successfully cancel orders', async () => {
    const orders = [
      createMockOrder({
        orderHash: '0x123',
        encodedOrder: '0xencoded1',
        routing: TradingApi.Routing.DUTCH_V2,
        status: TransactionStatus.Pending,
      }),
    ]

    const mockTxs = [{ hash: '0xtxhash' }]

    ;(validateOrdersForCancellation as any).mockReturnValue({
      error: null,
      chainId: UniverseChainId.Mainnet,
    })
    mockSelectChain.mockResolvedValue(true)
    ;(cancelMultipleUniswapXOrders as any).mockResolvedValue(mockTxs)

    const { result } = renderHook(() => useCancelMultipleOrdersCallback(orders))
    const callback = result.current

    const txs = await callback()
    expect(txs).toEqual(mockTxs)
    expect(cancelMultipleUniswapXOrders).toHaveBeenCalledWith({
      orders: [{ encodedOrder: '0xencoded1', routing: TradingApi.Routing.DUTCH_V2 }],
      chainId: UniverseChainId.Mainnet,
      provider: mockProvider,
      signerAddress: '0x1234567890123456789012345678901234567890',
    })
  })

  it('should throw WrongChainError when chain switch fails', async () => {
    const orders = [
      createMockOrder({
        encodedOrder: '0xencoded1',
        orderHash: '0x123',
      }),
    ]

    ;(validateOrdersForCancellation as any).mockReturnValue({
      error: null,
      chainId: UniverseChainId.Mainnet,
    })
    mockSelectChain.mockResolvedValue(false)

    const { result } = renderHook(() => useCancelMultipleOrdersCallback(orders))
    const callback = result.current

    const txs = await callback()
    expect(txs).toBeUndefined()
  })

  it('should fetch encoded orders when none available locally and proceed to cancel', async () => {
    const orders = [
      createMockOrder({
        orderHash: '0xabc',
        encodedOrder: undefined,
        routing: TradingApi.Routing.DUTCH_V2,
        status: TransactionStatus.Pending,
      }),
    ]

    ;(validateOrdersForCancellation as any).mockReturnValue({
      error: null,
      chainId: UniverseChainId.Mainnet,
    })

    // No local encoded orders
    ;(extractCancellationData as any).mockReturnValue([])

    // Fetched encoded order from Trading API
    ;(fetchLimitOrdersEncodedOrderData as any).mockResolvedValue([
      { orderHash: '0xabc', encodedOrder: '0xremoteEncoded', routing: TradingApi.Routing.DUTCH_V2 },
    ])

    // getOrdersMatchingCancellationData should match fetched
    ;(getOrdersMatchingCancellationData as any).mockReturnValue(orders)

    const mockTxs = [{ hash: '0xtxhash' }]
    mockSelectChain.mockResolvedValue(true)
    ;(cancelMultipleUniswapXOrders as any).mockResolvedValue(mockTxs)

    const { result } = renderHook(() => useCancelMultipleOrdersCallback(orders))
    const callback = result.current

    const txs = await callback()
    expect(txs).toEqual(mockTxs)
    // fetchEncodedOrderData is now called with orders and a fetcher function
    expect(fetchLimitOrdersEncodedOrderData).toHaveBeenCalledWith(orders, expect.any(Function))
    expect(cancelMultipleUniswapXOrders).toHaveBeenCalledWith({
      orders: [{ encodedOrder: '0xremoteEncoded', routing: TradingApi.Routing.DUTCH_V2 }],
      chainId: UniverseChainId.Mainnet,
      provider: mockProvider,
      signerAddress: '0x1234567890123456789012345678901234567890',
    })
  })

  it('should revert order statuses when cancellation fails', async () => {
    const orders = [
      createMockOrder({
        encodedOrder: '0xencoded1',
        orderHash: '0x123',
        status: TransactionStatus.Pending,
      }),
    ]

    ;(validateOrdersForCancellation as any).mockReturnValue({
      error: null,
      chainId: UniverseChainId.Mainnet,
    })
    mockSelectChain.mockResolvedValue(true)
    ;(cancelMultipleUniswapXOrders as any).mockResolvedValue(undefined)

    const { result } = renderHook(() => useCancelMultipleOrdersCallback(orders))
    const callback = result.current

    const txs = await callback()
    expect(txs).toBeUndefined()
  })
})
