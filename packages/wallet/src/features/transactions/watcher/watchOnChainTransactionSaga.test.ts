import { providers } from 'ethers'
import { call } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { cancelTransaction, transactionActions } from 'uniswap/src/features/transactions/slice'
import {
  fiatPurchaseTransactionInfo,
  getTxFixtures,
  transactionDetails as transactionDetailsFixture,
} from 'uniswap/src/test/fixtures'
import { mockApolloClient } from 'uniswap/src/test/mocks'
import { sleep } from 'utilities/src/time/timing'
import { attemptCancelTransaction } from 'wallet/src/features/transactions/cancelTransactionSaga'
import { logTransactionTimeout } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'
import { deleteTransaction } from 'wallet/src/features/transactions/watcher/transactionSagaUtils'
import { watchForAppBackgrounded } from 'wallet/src/features/transactions/watcher/watchForAppBackgroundedSaga'
import {
  checkIfTransactionInvalidated,
  waitForBridgeSendCompleted,
  waitForSameNonceFinalized,
  watchTransaction,
} from 'wallet/src/features/transactions/watcher/watchOnChainTransactionSaga'
import { waitForReceiptWithSmartPolling } from 'wallet/src/features/transactions/watcher/watchTransactionSaga'
import { getProvider } from 'wallet/src/features/wallet/context'

let mockGates: Record<string, boolean> = {}

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  getStatsigClient: jest.fn(() => ({
    checkGate: jest.fn((gate: string) => mockGates[gate] ?? false),
    getDynamicConfig: jest.fn(() => ({
      get: jest.fn(() => undefined),
    })),
    getLayer: jest.fn(() => ({
      get: jest.fn(() => false),
    })),
  })),
}))

const ACTIVE_ACCOUNT_ADDRESS = '0x000000000000000000000000000000000000000001'
const {
  ethersTxReceipt,
  txReceipt,
  txDetailsPending: originalTxDetailsPending,
} = getTxFixtures(transactionDetailsFixture({ typeInfo: fiatPurchaseTransactionInfo(), from: ACTIVE_ACCOUNT_ADDRESS }))
const txDetailsPending = { ...originalTxDetailsPending, from: ACTIVE_ACCOUNT_ADDRESS }

describe(watchTransaction, () => {
  let dateNowSpy: jest.SpyInstance
  const receiptProvider = {
    waitForTransaction: jest.fn(async () => {
      await sleep(1000)
      return null
    }),
  }

  beforeEach(() => {
    mockGates = {}
  })

  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => txReceipt.confirmedTime)
  })

  afterAll(() => {
    dateNowSpy.mockRestore()
  })

  const { chainId, id, from, options } = txDetailsPending

  it('Finalizes successful transaction', () => {
    const SUCCESS_RECEIPT: providers.TransactionReceipt = {
      ...ethersTxReceipt,
      status: 1, // indicate success
    }

    const providerMock = {
      getTransactionReceipt: jest.fn(async () => SUCCESS_RECEIPT),
      getBlockNumber: jest.fn(async () => SUCCESS_RECEIPT.blockNumber),
    } as unknown as providers.Provider

    const pendingTx = {
      ...txDetailsPending,
      options: { ...txDetailsPending.options, rpcSubmissionTimestampMs: Date.now() },
    }

    // --- Act / Assert ------------------------------------------------------
    return expectSaga(watchTransaction, { transaction: pendingTx, apolloClient: mockApolloClient })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), providerMock],
        // Stub smart-polling helper so the saga immediately receives the receipt
        [matchers.call.fn(waitForReceiptWithSmartPolling), SUCCESS_RECEIPT],
        // Downstream helper inside finalizeTransaction
        [call(getEnabledChainIdsSaga, Platform.EVM), { chains: [] }],
      ])
      .put.like({ action: { type: transactionActions.finalizeTransaction.type } })
      .silentRun()
  })

  it('Cancels transaction', () => {
    const cancelRequest = { to: from, from, value: '0x0' }
    return expectSaga(watchTransaction, {
      transaction: txDetailsPending,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(attemptCancelTransaction, txDetailsPending, cancelRequest), true],
      ])
      .dispatch(cancelTransaction({ chainId, id, address: from, cancelRequest }))
      .call(attemptCancelTransaction, txDetailsPending, cancelRequest)
      .silentRun()
  })

  it('Updates transaction when app is backgrounded', () => {
    const updatedTransaction = {
      ...txDetailsPending,
      options: { ...txDetailsPending.options, appBackgroundedWhilePending: true },
    }
    return expectSaga(watchTransaction, {
      transaction: txDetailsPending,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(watchForAppBackgrounded), true], // Mock app state change
      ])
      .put(transactionActions.updateTransaction(updatedTransaction))
      .silentRun()
  })

  it('Skips watching app state if appBackgroundedWhilePending is already true', () => {
    const txWithAppBackgrounded = {
      ...txDetailsPending,
      options: { ...txDetailsPending.options, appBackgroundedWhilePending: true },
    }

    return expectSaga(watchTransaction, {
      transaction: txWithAppBackgrounded,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(watchForAppBackgrounded), true], // Mock app state change, should not be called
      ])
      .not.put(transactionActions.updateTransaction(expect.anything()))
      .silentRun()
  })

  it('Invalidates stale transaction when another transaction with same nonce is finalized', () => {
    return expectSaga(watchTransaction, {
      transaction: txDetailsPending,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(waitForSameNonceFinalized, { chainId, id, nonce: options.request.nonce }), true],
      ])
      .call(deleteTransaction, txDetailsPending)
      .dispatch(transactionActions.deleteTransaction({ address: from, id, chainId }))
      .silentRun()
  })

  it('Invalidates stale transaction when bridge send is confirmed with same nonce', () => {
    return expectSaga(watchTransaction, {
      transaction: txDetailsPending,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(waitForBridgeSendCompleted, { chainId, id, nonce: options.request.nonce }), true],
      ])
      .call(deleteTransaction, txDetailsPending)
      .dispatch(transactionActions.deleteTransaction({ address: from, id, chainId }))
      .silentRun()
  })

  it('Logs timeout event without when transaction is pending for too long', () => {
    const transaction = {
      ...txDetailsPending,
      options: { ...txDetailsPending.options, timeoutTimestampMs: Date.now() },
      hash: undefined, // use undefined so the call to checkIfTransactionInvalidated returns false
    }

    return expectSaga(watchTransaction, {
      transaction,
      apolloClient: mockApolloClient,
    })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(logTransactionTimeout, transaction), undefined],
      ])
      .call(logTransactionTimeout, transaction)
      .silentRun()
  })
})

describe(checkIfTransactionInvalidated, () => {
  const mockProvider = {
    getTransaction: jest.fn(),
    getTransactionCount: jest.fn(),
  }
  const provider = mockProvider as unknown as providers.Provider
  const tx = {
    ...txDetailsPending,
    hash: '0x123',
    options: { ...txDetailsPending.options, request: { ...txDetailsPending.options.request, nonce: 5 } },
  }
  const requestNonce = 5

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns false if transaction has no nonce', () => {
    const txWithoutNonce = { ...tx, options: { ...tx.options, request: { ...tx.options.request, nonce: undefined } } }
    return expectSaga(checkIfTransactionInvalidated, txWithoutNonce, provider).returns(false).silentRun()
  })

  it('returns false if transaction has no hash', () => {
    const txWithoutHash = { ...tx, hash: undefined }
    return expectSaga(checkIfTransactionInvalidated, txWithoutHash, provider).returns(false).silentRun()
  })

  it('returns false if provider finds the transaction', () => {
    mockProvider.getTransaction.mockResolvedValueOnce({ hash: tx.hash }) // Mock a valid transaction object
    return expectSaga(checkIfTransactionInvalidated, tx, provider)
      .provide([[call([provider, provider.getTransaction], tx.hash), { hash: tx.hash }]])
      .returns(false)
      .silentRun()
  })

  it('returns true if provider does not find transaction and it was not submitted via private rpc', () => {
    const txPublic = { ...tx, options: { ...tx.options, submitViaPrivateRpc: false } }
    mockProvider.getTransaction.mockResolvedValueOnce(null)
    return expectSaga(checkIfTransactionInvalidated, txPublic, provider)
      .provide([[call([provider, provider.getTransaction], tx.hash), null]])
      .returns(true)
      .silentRun()
  })

  it('returns true if provider does not find transaction, submitted via private rpc, and nextNonce > requestNonce', () => {
    const txPrivate = { ...tx, options: { ...tx.options, submitViaPrivateRpc: true } }
    const nextNonce = requestNonce + 1
    mockProvider.getTransaction.mockResolvedValueOnce(null)
    mockProvider.getTransactionCount.mockResolvedValueOnce(nextNonce)
    return expectSaga(checkIfTransactionInvalidated, txPrivate, provider)
      .provide([
        [call([provider, provider.getTransaction], txPrivate.hash), null],
        [call([provider, provider.getTransactionCount], txPrivate.from), nextNonce],
      ])
      .returns(true)
      .silentRun()
  })

  it('returns false if provider does not find transaction, submitted via private rpc, and nextNonce <= requestNonce', () => {
    const txPrivate = { ...tx, options: { ...tx.options, submitViaPrivateRpc: true } }
    const nextNonce = requestNonce // Test with equal nonce
    mockProvider.getTransaction.mockResolvedValueOnce(null)
    mockProvider.getTransactionCount.mockResolvedValueOnce(nextNonce)
    return expectSaga(checkIfTransactionInvalidated, txPrivate, provider)
      .provide([
        [call([provider, provider.getTransaction], txPrivate.hash), null],
        [call([provider, provider.getTransactionCount], txPrivate.from), nextNonce],
      ])
      .returns(false)
      .silentRun()
  })

  it('returns false if provider does not find transaction, submitted via private rpc, and nextNonce < requestNonce', () => {
    const txPrivate = { ...tx, options: { ...tx.options, submitViaPrivateRpc: true } }
    const nextNonce = requestNonce - 1 // Test with lower nonce
    mockProvider.getTransaction.mockResolvedValueOnce(null)
    mockProvider.getTransactionCount.mockResolvedValueOnce(nextNonce)
    return expectSaga(checkIfTransactionInvalidated, txPrivate, provider)
      .provide([
        [call([provider, provider.getTransaction], txPrivate.hash), null],
        [call([provider, provider.getTransactionCount], txPrivate.from), nextNonce],
      ])
      .returns(false)
      .silentRun()
  })
})
