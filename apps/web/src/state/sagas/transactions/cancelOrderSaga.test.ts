import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { cancelTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { cancelOrderSaga } from '~/state/sagas/transactions/cancelOrderSaga'

const { mockGetSigner, mockLogger, mockUpdateTransaction, mockAppStore } = vi.hoisted(() => ({
  mockGetSigner: vi.fn(),
  mockLogger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
  mockUpdateTransaction: vi.fn((payload: unknown) => ({ type: 'transactions/updateTransaction', payload })),
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

vi.mock('uniswap/src/features/transactions/slice', () => ({
  cancelTransaction: Object.assign((payload: unknown) => ({ type: 'transactions/cancelTransaction', payload }), {
    type: 'transactions/cancelTransaction',
  }),
  updateTransaction: mockUpdateTransaction,
}))

function createTestStore({
  transactions = {},
}: {
  transactions?: Record<string, Record<number, Record<string, { status: TransactionStatus; [key: string]: unknown }>>>
} = {}) {
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({
    reducer: {
      transactions: (state = transactions) => state,
      _: (state = null) => state,
    },
    middleware: (getDefault) =>
      getDefault({ thunk: false, serializableCheck: false, immutableCheck: false }).concat(sagaMiddleware),
  })
  const task = sagaMiddleware.run(cancelOrderSaga)
  return { store, task }
}

describe('cancelOrderSaga', () => {
  const mockSendTransaction = vi.fn()
  const mockSigner = { sendTransaction: mockSendTransaction }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSigner.mockResolvedValue(mockSigner)
  })

  it('submits cancellation transaction on cancelTransaction dispatch', async () => {
    mockSendTransaction.mockResolvedValue({ hash: '0xabc123' })
    const { store, task } = createTestStore()

    const cancelRequest = { to: '0x000000000022d473030f116ddee9f6b43ac78ba3', data: '0x1234' }
    store.dispatch(
      cancelTransaction({
        chainId: UniverseChainId.Mainnet,
        id: 'order-123',
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        cancelRequest,
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockGetSigner).toHaveBeenCalledWith('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    expect(mockSendTransaction).toHaveBeenCalledWith(cancelRequest)

    task.cancel()
  })

  it('logs error when sendTransaction fails', async () => {
    const error = new Error('Transaction rejected')
    mockSendTransaction.mockRejectedValue(error)
    const { store, task } = createTestStore()

    store.dispatch(
      cancelTransaction({
        chainId: UniverseChainId.Mainnet,
        id: 'order-456',
        address: '0x123',
        cancelRequest: { to: '0xabc' },
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockLogger.error).toHaveBeenCalledWith(error, {
      tags: { file: 'cancelOrderSaga', function: 'handleCancelOrder' },
      extra: { chainId: UniverseChainId.Mainnet, id: 'order-456' },
    })

    task.cancel()
  })

  it('updates failed cancellation status when cancellation submission fails', async () => {
    const error = new Error('Transaction rejected')
    mockSendTransaction.mockRejectedValue(error)
    const address = '0x123'

    // Set up the app store mock so updateFailedCancellationStatus finds the transaction
    mockAppStore.getState.mockReturnValue({
      transactions: {
        [address]: {
          [UniverseChainId.Mainnet]: {
            'order-789': {
              id: 'order-789',
              chainId: UniverseChainId.Mainnet,
              from: address,
              status: TransactionStatus.Cancelling,
              options: { request: {} },
              typeInfo: { type: 'Swap' },
            },
          },
        },
      },
    })

    const { store, task } = createTestStore()

    store.dispatch(
      cancelTransaction({
        chainId: UniverseChainId.Mainnet,
        id: 'order-789',
        address,
        cancelRequest: { to: '0xabc' },
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockUpdateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-789',
        status: TransactionStatus.FailedCancel,
      }),
    )

    task.cancel()
  })

  it('continues listening after processing an action', async () => {
    mockSendTransaction.mockResolvedValue({ hash: '0xhash' })
    const { store, task } = createTestStore()

    store.dispatch(
      cancelTransaction({
        chainId: UniverseChainId.Mainnet,
        id: 'order-1',
        address: '0x111',
        cancelRequest: { to: '0xaaa' },
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    store.dispatch(
      cancelTransaction({
        chainId: UniverseChainId.Mainnet,
        id: 'order-2',
        address: '0x222',
        cancelRequest: { to: '0xbbb' },
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockGetSigner).toHaveBeenCalledTimes(2)
    expect(mockSendTransaction).toHaveBeenCalledTimes(2)
    expect(mockGetSigner).toHaveBeenNthCalledWith(1, '0x111')
    expect(mockGetSigner).toHaveBeenNthCalledWith(2, '0x222')

    task.cancel()
  })
})
