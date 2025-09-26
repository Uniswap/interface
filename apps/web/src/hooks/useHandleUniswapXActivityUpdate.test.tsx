import { TradingApi } from '@universe/api'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useHandleUniswapXActivityUpdate } from 'hooks/useHandleUniswapXActivityUpdate'
import { ActivityUpdateTransactionType, type UniswapXOrderUpdate } from 'state/activity/types'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { logUniswapXSwapFinalized } from 'tracing/swapFlowLoggers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { finalizeTransaction, updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  type UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'

const dispatchMock = vi.fn()
vi.mock('state/hooks', async () => {
  const actual = await vi.importActual('state/hooks')
  return {
    ...actual,
    useAppDispatch: () => dispatchMock,
  }
})

vi.mock('@uniswap/analytics', () => ({
  useTrace: vi.fn(() => ({ trace: 'mock-trace' })),
}))

vi.mock('components/Popups/registry', () => ({
  popupRegistry: {
    addPopup: vi.fn(),
  },
}))

vi.mock('tracing/swapFlowLoggers', () => ({
  logUniswapXSwapFinalized: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/types/utils', () => ({
  isFinalizedTx: vi.fn(),
}))

describe('useHandleUniswapXActivityUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockUniswapXOrderDetails = (overrides?: Partial<UniswapXOrderDetails>): UniswapXOrderDetails => ({
    id: 'order-id',
    from: '0xSenderAddress',
    chainId: UniverseChainId.Mainnet,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: {
      type: TransactionType.Swap,
      tradeType: 0,
      inputCurrencyId: '0xInputToken',
      outputCurrencyId: '0xOutputToken',
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '2000000000000000000',
      minimumOutputCurrencyAmountRaw: '1900000000000000000',
      expectedOutputCurrencyAmountRaw: '2000000000000000000',
      settledOutputCurrencyAmountRaw: '2000000000000000000',
    },
    routing: TradingApi.Routing.DUTCH_V2,
    orderHash: '0xOrderHash',
    hash: undefined,
    ...overrides,
  })

  const createMockActivity = (
    originalOverrides?: Partial<UniswapXOrderDetails>,
    updateOverrides?: Partial<UniswapXOrderDetails>,
  ): UniswapXOrderUpdate => ({
    type: ActivityUpdateTransactionType.UniswapXOrder,
    chainId: UniverseChainId.Mainnet,
    original: createMockUniswapXOrderDetails(originalOverrides),
    update: createMockUniswapXOrderDetails({
      ...originalOverrides,
      ...updateOverrides,
    }),
  })

  it('should finalize transaction when update is finalized', () => {
    mocked(isFinalizedTx).mockReturnValue(true)

    const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
    const handleUpdate = result.current

    const activity = createMockActivity(
      { status: TransactionStatus.Pending },
      { status: TransactionStatus.Success, hash: '0xSuccessHash' },
    )

    handleUpdate({
      activity,
      popupDismissalTime: 5000,
    })

    // Should call both updateTransaction and finalizeTransaction when finalized
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: updateTransaction.type,
        payload: activity.update,
      }),
    )
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: finalizeTransaction.type,
        payload: activity.update,
      }),
    )
  })

  it('should update transaction when update is not finalized', () => {
    mocked(isFinalizedTx).mockReturnValue(false)

    const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
    const handleUpdate = result.current

    const activity = createMockActivity({ status: TransactionStatus.Pending }, { status: TransactionStatus.Pending })

    handleUpdate({
      activity,
      popupDismissalTime: 5000,
    })

    // Should only call updateTransaction when not finalized
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: updateTransaction.type,
        payload: activity.update,
      }),
    )
    expect(dispatchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: finalizeTransaction.type,
      }),
    )
  })

  describe('popup handling', () => {
    it('should add transaction popup when update is successful with hash', () => {
      mocked(isFinalizedTx).mockReturnValue(true)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity(
        { status: TransactionStatus.Pending },
        { status: TransactionStatus.Success, hash: '0xSuccessHash' },
      )

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(popupRegistry.addPopup).toHaveBeenCalledWith(
        {
          type: PopupType.Transaction,
          hash: '0xSuccessHash',
        },
        '0xSuccessHash',
        5000,
      )
    })

    it('should add order popup when status changes and no success hash', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity(
        { status: TransactionStatus.Pending, orderHash: '0xOrderHash' },
        { status: TransactionStatus.Canceled, hash: undefined },
      )

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(popupRegistry.addPopup).toHaveBeenCalledWith(
        {
          type: PopupType.Order,
          orderHash: '0xOrderHash',
        },
        '0xOrderHash',
        5000,
      )
    })

    it('should not add popup when status does not change', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity({ status: TransactionStatus.Pending }, { status: TransactionStatus.Pending })

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(popupRegistry.addPopup).not.toHaveBeenCalled()
    })

    it('should not add order popup when original has no orderHash', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity(
        { status: TransactionStatus.Pending, orderHash: undefined },
        { status: TransactionStatus.Canceled, hash: undefined },
      )

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(popupRegistry.addPopup).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: PopupType.Order,
        }),
        expect.any(String),
        expect.any(Number),
      )
    })
  })

  describe('analytics logging', () => {
    it('should log successful non-limit order', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity(
        { routing: TradingApi.Routing.DUTCH_V2, orderHash: '0xOrderHash' },
        { status: TransactionStatus.Success, hash: '0xSuccessHash' },
      )

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(logUniswapXSwapFinalized).toHaveBeenCalledWith({
        id: 'order-id',
        hash: '0xSuccessHash',
        orderHash: '0xOrderHash',
        chainId: UniverseChainId.Mainnet,
        analyticsContext: { trace: 'mock-trace' },
        routing: TradingApi.Routing.DUTCH_V2,
        status: TransactionStatus.Success,
      })
    })

    it('should not log successful limit order', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity(
        { routing: TradingApi.Routing.DUTCH_LIMIT, orderHash: '0xOrderHash' },
        { status: TransactionStatus.Success },
      )

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(logUniswapXSwapFinalized).not.toHaveBeenCalled()
    })

    it('should log canceled order', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity(
        { routing: TradingApi.Routing.DUTCH_V2, orderHash: '0xOrderHash' },
        { status: TransactionStatus.Canceled, hash: '0xCancelHash' },
      )

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(logUniswapXSwapFinalized).toHaveBeenCalledWith({
        id: 'order-id',
        hash: '0xCancelHash',
        orderHash: '0xOrderHash',
        chainId: UniverseChainId.Mainnet,
        analyticsContext: { trace: 'mock-trace' },
        routing: TradingApi.Routing.DUTCH_V2,
        status: TransactionStatus.Canceled,
      })
    })

    it('should log expired order', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity(
        { routing: TradingApi.Routing.DUTCH_V2, orderHash: '0xOrderHash' },
        { status: TransactionStatus.Expired },
      )

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(logUniswapXSwapFinalized).toHaveBeenCalledWith({
        id: 'order-id',
        hash: undefined,
        orderHash: '0xOrderHash',
        chainId: UniverseChainId.Mainnet,
        analyticsContext: { trace: 'mock-trace' },
        routing: TradingApi.Routing.DUTCH_V2,
        status: TransactionStatus.Expired,
      })
    })

    it('should not log when original has no orderHash', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity({ orderHash: undefined }, { status: TransactionStatus.Success })

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(logUniswapXSwapFinalized).not.toHaveBeenCalled()
    })

    it('should not log for pending status', () => {
      mocked(isFinalizedTx).mockReturnValue(false)

      const { result } = renderHook(() => useHandleUniswapXActivityUpdate())
      const handleUpdate = result.current

      const activity = createMockActivity({ orderHash: '0xOrderHash' }, { status: TransactionStatus.Pending })

      handleUpdate({
        activity,
        popupDismissalTime: 5000,
      })

      expect(logUniswapXSwapFinalized).not.toHaveBeenCalled()
    })
  })
})
