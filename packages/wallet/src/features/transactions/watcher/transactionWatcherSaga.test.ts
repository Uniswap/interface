import { faker } from '@faker-js/faker'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  addTransaction,
  deleteTransaction,
  transactionReducer,
  updateTransaction,
} from 'uniswap/src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { approveTransactionInfo, transactionDetails as txDetailsFixture } from 'uniswap/src/test/fixtures'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { getPendingPrivateTxCount } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import { transactionWatcher } from 'wallet/src/features/transactions/watcher/transactionWatcherSaga'
import { watchTransaction } from 'wallet/src/features/transactions/watcher/watchOnChainTransactionSaga'
import { getProvider, getProviderManager } from 'wallet/src/features/wallet/context'
import { getTxProvidersMocks } from 'wallet/src/test/mocks'

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
  sendAppsFlyerEvent: vi.fn(),
}))

const ACTIVE_ACCOUNT_ADDRESS = '0x000000000000000000000000000000000000000001'

describe(transactionWatcher, () => {
  const { mockProvider, mockProviderManager } = getTxProvidersMocks(undefined)

  beforeEach(() => {
    vi.mocked(sendAnalyticsEvent).mockClear()
  })

  it('Triggers watchers successfully', () => {
    const approveTxDetailsPending = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      // Recent enough to be watched rather than cleared as stale
      addedTime: Date.now(),
    })

    const hash1 = faker.datatype.uuid()
    const hash2 = faker.datatype.uuid()

    return expectSaga(transactionWatcher)
      .withState({
        transactions: {
          byChainId: {
            [UniverseChainId.Mainnet]: {
              '0': approveTxDetailsPending,
            },
          },
        },
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, UniverseChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .fork(watchTransaction, {
        transaction: approveTxDetailsPending,
      })
      .dispatch(addTransaction({ ...approveTxDetailsPending, hash: hash1 }))
      .fork(watchTransaction, {
        transaction: { ...approveTxDetailsPending, hash: hash1 },
      })
      .dispatch(updateTransaction({ ...approveTxDetailsPending, hash: hash2 }))
      .fork(watchTransaction, {
        transaction: { ...approveTxDetailsPending, hash: hash2 },
      })
      .silentRun()
  })

  it('emits the startup backlog census with the private-pending subset count (SWAP-2471)', () => {
    // Two CLASSIC Pending private-RPC txs (counted) plus one CLASSIC Pending non-private tx
    // (incomplete but excluded) — so private_pending_count is a strict subset of total_incomplete.
    const privatePendingTx1 = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      options: { request: {}, submitViaPrivateRpc: true },
    })
    const privatePendingTx2 = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      options: { request: {}, submitViaPrivateRpc: true },
    })
    const publicPendingTx = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      options: { request: {}, submitViaPrivateRpc: false },
    })

    return expectSaga(transactionWatcher)
      .withState({
        transactions: {
          byChainId: {
            [UniverseChainId.Mainnet]: {
              '0': privatePendingTx1,
              '1': privatePendingTx2,
              '2': publicPendingTx,
            },
          },
        },
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, UniverseChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .silentRun()
      .then(() => {
        expect(vi.mocked(sendAnalyticsEvent)).toHaveBeenCalledWith(
          WalletEventName.PendingTransactionBacklogOnStartup,
          expect.objectContaining({
            total_incomplete: 3,
            private_pending_count: 2,
          }),
        )
      })
  })

  it('clears stale local pending transactions on startup instead of watching them', () => {
    const staleTx = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      addedTime: Date.now() - 16 * ONE_MINUTE_MS,
    })
    const freshTx = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      addedTime: Date.now(),
    })

    return expectSaga(transactionWatcher)
      .withState({
        transactions: {
          [ACTIVE_ACCOUNT_ADDRESS]: {
            [UniverseChainId.Mainnet]: {
              [staleTx.id]: staleTx,
              [freshTx.id]: freshTx,
            },
          },
        },
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, UniverseChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .put(deleteTransaction({ address: staleTx.from, id: staleTx.id, chainId: staleTx.chainId }))
      .fork(watchTransaction, { transaction: freshTx })
      .not.fork(watchTransaction, { transaction: staleTx })
      .silentRun()
  })

  it('re-watches a persisted source-confirmed bridge instead of clearing it as stale', () => {
    // A bridge intentionally stays Pending with sendConfirmed after the source-chain receipt so the
    // watcher can resume waitForBridgingStatus after a restart — it must survive stale cleanup no
    // matter how old it is. A bridge whose send was never confirmed clears like any other ghost tx.
    const sendConfirmedBridgeTx = {
      ...txDetailsFixture({
        typeInfo: approveTransactionInfo(),
        status: TransactionStatus.Pending,
        hash: faker.datatype.uuid(),
        from: ACTIVE_ACCOUNT_ADDRESS,
        chainId: UniverseChainId.Mainnet,
        addedTime: Date.now() - 60 * ONE_MINUTE_MS,
      }),
      routing: TradingApi.Routing.BRIDGE,
      sendConfirmed: true,
    } as TransactionDetails
    const unconfirmedStaleBridgeTx = {
      ...txDetailsFixture({
        typeInfo: approveTransactionInfo(),
        status: TransactionStatus.Pending,
        hash: faker.datatype.uuid(),
        from: ACTIVE_ACCOUNT_ADDRESS,
        chainId: UniverseChainId.Mainnet,
        addedTime: Date.now() - 60 * ONE_MINUTE_MS,
      }),
      routing: TradingApi.Routing.BRIDGE,
    } as TransactionDetails

    return expectSaga(transactionWatcher)
      .withState({
        transactions: {
          [ACTIVE_ACCOUNT_ADDRESS]: {
            [UniverseChainId.Mainnet]: {
              [sendConfirmedBridgeTx.id]: sendConfirmedBridgeTx,
              [unconfirmedStaleBridgeTx.id]: unconfirmedStaleBridgeTx,
            },
          },
        },
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, UniverseChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .not.put(
        deleteTransaction({
          address: sendConfirmedBridgeTx.from,
          id: sendConfirmedBridgeTx.id,
          chainId: sendConfirmedBridgeTx.chainId,
        }),
      )
      .fork(watchTransaction, { transaction: sendConfirmedBridgeTx })
      .put(
        deleteTransaction({
          address: unconfirmedStaleBridgeTx.from,
          id: unconfirmedStaleBridgeTx.id,
          chainId: unconfirmedStaleBridgeTx.chainId,
        }),
      )
      .not.fork(watchTransaction, { transaction: unconfirmedStaleBridgeTx })
      .silentRun()
  })

  it('cleared stale private-RPC txs stop inflating the locally-derived nonce', async () => {
    // A whole private queue past its threshold: both txs clear together, so the derived nonce
    // drops cleanly to the on-chain pending nonce with no hole left behind.
    const stalePrivateTx = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      addedTime: Date.now() - 20 * ONE_MINUTE_MS,
      options: { request: {}, submitViaPrivateRpc: true },
    })
    const newerStalePrivateTx = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      addedTime: Date.now() - 16 * ONE_MINUTE_MS,
      options: { request: {}, submitViaPrivateRpc: true },
    })
    const initialState = {
      transactions: {
        [ACTIVE_ACCOUNT_ADDRESS]: {
          [UniverseChainId.Mainnet]: {
            [stalePrivateTx.id]: stalePrivateTx,
            [newerStalePrivateTx.id]: newerStalePrivateTx,
          },
        },
      },
      wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
      userSettings: { isTestnetModeEnabled: false },
    }

    // Before cleanup, the stuck private txs inflate the next locally-derived nonce
    await expectSaga(getPendingPrivateTxCount, ACTIVE_ACCOUNT_ADDRESS, UniverseChainId.Mainnet)
      .withState(initialState)
      .returns(2)
      .run()

    // Run the watcher with a real transactions reducer so the cleanup actually mutates state
    const { storeState } = await expectSaga(transactionWatcher)
      .withReducer(
        combineReducers({
          transactions: transactionReducer,
          wallet: (state = initialState.wallet) => state,
          userSettings: (state = initialState.userSettings) => state,
        }),
        initialState,
      )
      .provide([
        [call(getProvider, UniverseChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .silentRun()

    expect(storeState.transactions[ACTIVE_ACCOUNT_ADDRESS]?.[UniverseChainId.Mainnet]).not.toHaveProperty(
      stalePrivateTx.id,
    )
    expect(storeState.transactions[ACTIVE_ACCOUNT_ADDRESS]?.[UniverseChainId.Mainnet]).not.toHaveProperty(
      newerStalePrivateTx.id,
    )

    // After cleanup, nonce derivation no longer counts them — future txs use the on-chain pending nonce
    await expectSaga(getPendingPrivateTxCount, ACTIVE_ACCOUNT_ADDRESS, UniverseChainId.Mainnet)
      .withState(storeState)
      .returns(0)
      .run()
  })

  it('keeps a whole private-RPC queue when its ages straddle the staleness threshold', () => {
    // Clearing only the stale member would leave the queue-derived nonce pointing at a hole,
    // wedging new submissions with nonce-too-high — so neither tx is cleared.
    const stalePrivateTx = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      addedTime: Date.now() - 20 * ONE_MINUTE_MS,
      options: { request: {}, submitViaPrivateRpc: true },
    })
    const freshPrivateTx = txDetailsFixture({
      typeInfo: approveTransactionInfo(),
      status: TransactionStatus.Pending,
      hash: faker.datatype.uuid(),
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      addedTime: Date.now() - 6 * ONE_MINUTE_MS,
      options: { request: {}, submitViaPrivateRpc: true },
    })

    return expectSaga(transactionWatcher)
      .withState({
        transactions: {
          [ACTIVE_ACCOUNT_ADDRESS]: {
            [UniverseChainId.Mainnet]: {
              [stalePrivateTx.id]: stalePrivateTx,
              [freshPrivateTx.id]: freshPrivateTx,
            },
          },
        },
        wallet: { activeAccountAddress: ACTIVE_ACCOUNT_ADDRESS },
        userSettings: { isTestnetModeEnabled: false },
      })
      .provide([
        [call(getProvider, UniverseChainId.Mainnet), mockProvider],
        [call(getProviderManager), mockProviderManager],
      ])
      .not.put(
        deleteTransaction({ address: stalePrivateTx.from, id: stalePrivateTx.id, chainId: stalePrivateTx.chainId }),
      )
      .not.put(
        deleteTransaction({ address: freshPrivateTx.from, id: freshPrivateTx.id, chainId: freshPrivateTx.chainId }),
      )
      .fork(watchTransaction, { transaction: stalePrivateTx })
      .fork(watchTransaction, { transaction: freshPrivateTx })
      .silentRun()
  })
})
