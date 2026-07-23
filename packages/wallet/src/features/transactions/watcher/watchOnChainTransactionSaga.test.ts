import { waitForFlashbotsProtectReceipt } from '@universe/chains'
import { providers } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { cancelTransaction, transactionActions } from 'uniswap/src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  fiatPurchaseTransactionInfo,
  getTxFixtures,
  transactionDetails as transactionDetailsFixture,
} from 'uniswap/src/test/fixtures'
import { mockApolloClient } from 'uniswap/src/test/mocks'
import { sleep } from 'utilities/src/time/timing'
import type { MockInstance } from 'vitest'
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
import { waitForTransactionStatus } from 'wallet/src/features/transactions/watcher/watchTransactionSaga'
import { getProvider } from 'wallet/src/features/wallet/context'

vi.mock('@universe/api', async () => ({
  ...(await vi.importActual('@universe/api')),
  provideSessionService: vi.fn(() => ({
    createSession: vi.fn(),
    getSession: vi.fn(),
    getSessionState: vi.fn().mockResolvedValue(null),
  })),
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: {
    fetchSwaps: vi.fn().mockResolvedValue({ swaps: [] }),
  },
  // Referenced by TradingApiSessionClient, which is loaded transitively in this test's import graph
  getFeatureFlaggedHeaders: vi.fn().mockResolvedValue({}),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
  sendAppsFlyerEvent: vi.fn(),
}))

const ACTIVE_ACCOUNT_ADDRESS = '0x000000000000000000000000000000000000000001'
const {
  ethersTxReceipt,
  txReceipt,
  txDetailsPending: originalTxDetailsPending,
} = getTxFixtures(transactionDetailsFixture({ typeInfo: fiatPurchaseTransactionInfo(), from: ACTIVE_ACCOUNT_ADDRESS }))
const txDetailsPending: TransactionDetails = { ...originalTxDetailsPending, from: ACTIVE_ACCOUNT_ADDRESS }

describe(watchTransaction, () => {
  let dateNowSpy: MockInstance
  const receiptProvider = {
    waitForTransaction: vi.fn(async () => {
      await sleep(1000)
      return null
    }),
    getTransactionReceipt: vi.fn(),
    getBlockNumber: vi.fn(),
  }

  // Build transaction state structure for selectors
  const getTransactionsState = (
    tx: typeof txDetailsPending,
  ): Record<string, Record<number, Record<string, TransactionDetails>>> => ({
    [ACTIVE_ACCOUNT_ADDRESS]: {
      [tx.chainId]: {
        [tx.id]: tx,
      },
    },
  })

  beforeAll(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => txReceipt.confirmedTime)
  })

  afterAll(() => {
    dateNowSpy.mockRestore()
  })

  const { chainId, id, from, options } = txDetailsPending

  it('Finalizes successful transaction', () => {
    const providerMock = {
      getTransactionReceipt: vi.fn(),
      getBlockNumber: vi.fn(),
      waitForTransaction: vi.fn(async () => ethersTxReceipt),
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
        transactions: getTransactionsState(pendingTx),
      })
      .provide([
        [call(getProvider, chainId), providerMock],
        // For non-bridge transactions, waitForTransactionStatus is called (Trading API polling)
        [matchers.call.fn(waitForTransactionStatus), { status: TransactionStatus.Success }],
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
        transactions: getTransactionsState(txDetailsPending),
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
        transactions: getTransactionsState(txDetailsPending),
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
        transactions: getTransactionsState(txWithAppBackgrounded),
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(watchForAppBackgrounded), true], // Mock app state change, should not be called
      ])
      .not.put(transactionActions.updateTransaction(expect.anything() as unknown as TransactionDetails))
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
        transactions: getTransactionsState(txDetailsPending),
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(waitForSameNonceFinalized, { chainId, id, nonce: options.request?.nonce }), true],
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
        transactions: getTransactionsState(txDetailsPending),
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        [call(waitForBridgeSendCompleted, { chainId, id, nonce: options.request?.nonce }), true],
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
        transactions: getTransactionsState(transaction),
      })
      .provide([
        [call(getProvider, chainId), receiptProvider],
        // For non-bridge transactions, waitForTransactionStatus is called (Trading API polling)
        [matchers.call.fn(waitForTransactionStatus), { status: TransactionStatus.Success }],
        [call(logTransactionTimeout, transaction), undefined],
      ])
      .call(logTransactionTimeout, transaction)
      .silentRun()
  })
})

describe(checkIfTransactionInvalidated, () => {
  const mockProvider = {
    getTransaction: vi.fn(),
    getTransactionCount: vi.fn(),
  }
  const provider = mockProvider as unknown as providers.Provider
  const tx = {
    ...txDetailsPending,
    hash: '0x123',
    options: { ...txDetailsPending.options, request: { ...txDetailsPending.options.request, nonce: 5 } },
  }
  const requestNonce = 5

  beforeEach(() => {
    vi.clearAllMocks()
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

  it('emits a PendingTransactionStuck event for a private tx stuck in the recovery hole (SWAP-2471)', async () => {
    const txPrivate = { ...tx, options: { ...tx.options, submitViaPrivateRpc: true } }
    const nextNonce = requestNonce // stuck: nextNonce === requestNonce
    mockProvider.getTransaction.mockResolvedValueOnce(null)
    mockProvider.getTransactionCount.mockResolvedValueOnce(nextNonce)
    await expectSaga(checkIfTransactionInvalidated, txPrivate, provider)
      .provide([
        [call([provider, provider.getTransaction], txPrivate.hash), null],
        [call([provider, provider.getTransactionCount], txPrivate.from), nextNonce],
      ])
      .returns(false)
      .silentRun()
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      WalletEventName.PendingTransactionStuck,
      expect.objectContaining({
        reason: 'invalidation_check_false',
        request_nonce: 5,
        next_nonce: 5,
        provider_knows_tx: false,
      }),
    )
  })
})

describe('waitForRemoteUpdate flashbots_unknown (SWAP-2471)', () => {
  const { chainId } = txDetailsPending

  const buildTransactionsState = (
    tx: TransactionDetails,
  ): Record<string, Record<number, Record<string, TransactionDetails>>> => ({
    [ACTIVE_ACCOUNT_ADDRESS]: { [tx.chainId]: { [tx.id]: tx } },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Drives the (unexported) waitForRemoteUpdate -> getFlashbotsTransactionStatus path through the
  // exported watchTransaction saga: a CLASSIC private-RPC tx whose Flashbots receipt is 'UNKNOWN'.
  it('emits PendingTransactionStuck with reason flashbots_unknown and omits provider_knows_tx', async () => {
    const flashbotsTx: TransactionDetails = {
      ...txDetailsPending,
      options: {
        ...txDetailsPending.options,
        submitViaPrivateRpc: true,
        // already-backgrounded so the watcher doesn't add the app-backgrounded race branch
        appBackgroundedWhilePending: true,
      },
    }

    const providerMock = {
      getTransactionReceipt: vi.fn(),
      getBlockNumber: vi.fn(),
      waitForTransaction: vi.fn(),
    } as unknown as providers.Provider

    await expectSaga(watchTransaction, { transaction: flashbotsTx, apolloClient: mockApolloClient })
      .withState({
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
        transactions: buildTransactionsState(flashbotsTx),
      })
      .provide([
        [call(getProvider, chainId), providerMock],
        [matchers.call.fn(waitForFlashbotsProtectReceipt), { status: 'UNKNOWN' }],
        // After the UNKNOWN flashbots status, waitForRemoteUpdate falls through to the Trading-API poll.
        [matchers.call.fn(waitForTransactionStatus), { status: TransactionStatus.Success }],
        // finalizeTransaction downstream helper
        [call(getEnabledChainIdsSaga, Platform.EVM), { chains: [] }],
      ])
      .silentRun()

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      WalletEventName.PendingTransactionStuck,
      expect.objectContaining({ reason: 'flashbots_unknown', transaction_id: flashbotsTx.id }),
    )

    // provider_knows_tx must be OMITTED on this path (only the Flashbots relay was awaited, never the
    // chain provider) — emitting false would mislead.
    const analyticsCalls = vi.mocked(sendAnalyticsEvent).mock.calls
    const stuckCall = analyticsCalls.find(
      ([eventName, payload]) =>
        eventName === WalletEventName.PendingTransactionStuck &&
        (payload as { reason?: string }).reason === 'flashbots_unknown',
    )
    expect(stuckCall).toBeDefined()
    const stuckPayload = stuckCall?.[1] as Record<string, unknown>
    expect('provider_knows_tx' in stuckPayload).toBe(false)
  })
})
