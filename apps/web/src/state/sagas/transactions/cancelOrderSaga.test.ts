import { configureStore } from '@reduxjs/toolkit'
import { TradingApi } from '@universe/api'
import { getFeatureFlag } from '@universe/gating'
import createSagaMiddleware from 'redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  addTransaction,
  cancelTransaction,
  orderCancelBroadcasted,
  orderCancelFailed,
} from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { Mock } from 'vitest'
import { popupRegistry } from '~/state/popups/registry'
import { cancelOrderSaga } from '~/state/sagas/transactions/cancelOrderSaga'

const { mockGetSigner, mockLogger, mockAppStore } = vi.hoisted(() => ({
  mockGetSigner: vi.fn(),
  mockLogger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  mockAppStore: {
    getState: vi.fn(() => ({ transactions: {} })),
    dispatch: vi.fn(),
  },
}))

vi.mock('~/state/sagas/transactions/utils', () => ({
  getSigner: mockGetSigner,
}))

vi.mock('~/state', () => ({
  default: mockAppStore,
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: mockLogger,
}))

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  getFeatureFlag: vi.fn(() => true),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const ORDER_ID = 'order-123'
const ORDER_HASH = '0xorderhash'
const CANCEL_TX_HASH = '0xabc123'

function makeStateWithOrder({ status = TransactionStatus.Cancelling }: { status?: TransactionStatus } = {}) {
  return {
    transactions: {
      [ADDRESS]: {
        [UniverseChainId.Mainnet]: {
          [ORDER_ID]: {
            id: ORDER_ID,
            chainId: UniverseChainId.Mainnet,
            from: ADDRESS,
            status,
            routing: TradingApi.Routing.DUTCH_LIMIT,
            orderHash: ORDER_HASH,
            addedTime: Date.now(),
            typeInfo: { type: TransactionType.Swap },
          },
        },
      },
    },
  }
}

function createTestStore() {
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({
    reducer: {
      transactions: (state = {}) => state,
      _: (state = null) => state,
    },
    middleware: (getDefault) =>
      getDefault({ thunk: false, serializableCheck: false, immutableCheck: false }).concat(sagaMiddleware),
  })
  const task = sagaMiddleware.run(cancelOrderSaga)
  return { store, task }
}

function dispatchCancel(
  store: ReturnType<typeof createTestStore>['store'],
  overrides: Partial<Parameters<typeof cancelTransaction>[0]> = {},
) {
  store.dispatch(
    cancelTransaction({
      chainId: UniverseChainId.Mainnet,
      id: ORDER_ID,
      address: ADDRESS,
      cancelRequest: { to: '0x000000000022d473030f116ddee9f6b43ac78ba3', data: '0x1234' },
      cancelInitiatedTimeMs: Date.now(),
      ...overrides,
    }),
  )
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 10))

describe('cancelOrderSaga', () => {
  const mockSendTransaction = vi.fn()
  const mockSigner = { sendTransaction: mockSendTransaction }
  let addPopupSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSigner.mockResolvedValue(mockSigner)
    mockAppStore.getState.mockReturnValue(makeStateWithOrder())
    ;(getFeatureFlag as Mock).mockReturnValue(true)
    addPopupSpy = vi.spyOn(popupRegistry, 'addPopup').mockImplementation(() => undefined)
  })

  afterEach(() => {
    addPopupSpy.mockRestore()
  })

  describe('successful broadcast', () => {
    it('submits the cancellation and persists the broadcast fields', async () => {
      mockSendTransaction.mockResolvedValue({ hash: CANCEL_TX_HASH })
      const { store, task } = createTestStore()

      dispatchCancel(store)
      await flush()

      expect(mockGetSigner).toHaveBeenCalledWith(ADDRESS)
      expect(mockSendTransaction).toHaveBeenCalled()

      const broadcastAction = mockAppStore.dispatch.mock.calls
        .map(([action]) => action)
        .find((action) => action.type === orderCancelBroadcasted.type)
      expect(broadcastAction?.payload).toEqual(
        expect.objectContaining({
          address: ADDRESS,
          chainId: UniverseChainId.Mainnet,
          id: ORDER_ID,
          cancelTxHash: CANCEL_TX_HASH,
        }),
      )

      task.cancel()
    })

    it('anchors the broadcast timestamp at broadcast, not at the button click', async () => {
      vi.useFakeTimers()
      try {
        const clickTime = Date.now()
        let resolveSend: (value: { hash: string }) => void = () => undefined
        mockSendTransaction.mockReturnValue(
          new Promise((resolve) => {
            resolveSend = resolve
          }),
        )
        const { store, task } = createTestStore()

        dispatchCancel(store, { cancelInitiatedTimeMs: clickTime })
        await vi.advanceTimersByTimeAsync(90_000) // 90s in the wallet prompt
        resolveSend({ hash: CANCEL_TX_HASH })
        await vi.advanceTimersByTimeAsync(10)

        const broadcastAction = mockAppStore.dispatch.mock.calls
          .map(([action]) => action)
          .find((action) => action.type === orderCancelBroadcasted.type)
        expect(broadcastAction?.payload.broadcastTimeMs).toBeGreaterThanOrEqual(clickTime + 90_000)

        task.cancel()
      } finally {
        vi.useRealTimers()
      }
    })

    it('registers the tracked cancel tx as a plain-hash Pending tx (flag on)', async () => {
      mockSendTransaction.mockResolvedValue({ hash: CANCEL_TX_HASH })
      const { store, task } = createTestStore()

      dispatchCancel(store)
      await flush()

      const addAction = mockAppStore.dispatch.mock.calls
        .map(([action]) => action)
        .find((action) => action.type === addTransaction.type)
      expect(addAction?.payload).toEqual(
        expect.objectContaining({
          id: CANCEL_TX_HASH,
          hash: CANCEL_TX_HASH,
          status: TransactionStatus.Pending,
          typeInfo: { type: TransactionType.UniswapXCancel, orderHashes: [ORDER_HASH] },
        }),
      )
      expect(addAction?.payload.batchInfo).toBeUndefined()

      task.cancel()
    })

    it('does not register a tracked cancel tx when the flag is off', async () => {
      ;(getFeatureFlag as Mock).mockReturnValue(false)
      mockSendTransaction.mockResolvedValue({ hash: CANCEL_TX_HASH })
      const { store, task } = createTestStore()

      dispatchCancel(store)
      await flush()

      const addAction = mockAppStore.dispatch.mock.calls
        .map(([action]) => action)
        .find((action) => action.type === addTransaction.type)
      expect(addAction).toBeUndefined()

      task.cancel()
    })
  })

  describe('error classification (rejection ≠ broadcast failure ≠ FailedCancel)', () => {
    it('user rejection (4001) reverts quietly to Pending — never FailedCancel, no error surface', async () => {
      mockSendTransaction.mockRejectedValue({ code: 4001 })
      const { store, task } = createTestStore()

      dispatchCancel(store)
      await flush()

      const dispatched = mockAppStore.dispatch.mock.calls.map(([action]) => action)
      const failedAction = dispatched.find((action) => action.type === orderCancelFailed.type)
      expect(failedAction?.payload).toEqual(
        expect.objectContaining({ reason: 'rejected', revertToStatus: TransactionStatus.Pending }),
      )
      expect(dispatched.some((action) => action.payload?.status === TransactionStatus.FailedCancel)).toBe(false)
      expect(addPopupSpy).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()

      task.cancel()
    })

    it('restores a pre-cancel InsufficientFunds status on rejection, not blanket Pending', async () => {
      mockSendTransaction.mockRejectedValue({ code: 'ACTION_REJECTED' })
      const { store, task } = createTestStore()

      dispatchCancel(store, { revertToStatus: TransactionStatus.InsufficientFunds })
      await flush()

      const failedAction = mockAppStore.dispatch.mock.calls
        .map(([action]) => action)
        .find((action) => action.type === orderCancelFailed.type)
      expect(failedAction?.payload.revertToStatus).toBe(TransactionStatus.InsufficientFunds)

      task.cancel()
    })

    it('broadcast failure reverts to Pending with a "Try again" surface and the raw error logged — still no FailedCancel', async () => {
      const error = new Error('nonce too low')
      mockSendTransaction.mockRejectedValue(error)
      const { store, task } = createTestStore()

      dispatchCancel(store)
      await flush()

      const dispatched = mockAppStore.dispatch.mock.calls.map(([action]) => action)
      const failedAction = dispatched.find((action) => action.type === orderCancelFailed.type)
      expect(failedAction?.payload).toEqual(
        expect.objectContaining({ reason: 'broadcast-failed', revertToStatus: TransactionStatus.Pending }),
      )
      expect(dispatched.some((action) => action.payload?.status === TransactionStatus.FailedCancel)).toBe(false)
      expect(addPopupSpy).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(error, expect.anything())

      task.cancel()
    })
  })

  it('continues listening after processing an action', async () => {
    mockSendTransaction.mockResolvedValue({ hash: '0xhash' })
    const { store, task } = createTestStore()

    dispatchCancel(store, { id: 'order-1' })
    await flush()
    dispatchCancel(store, { id: 'order-2' })
    await flush()

    expect(mockSendTransaction).toHaveBeenCalledTimes(2)

    task.cancel()
  })
})
