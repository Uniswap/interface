import { faker } from '@faker-js/faker'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { addTransaction, updateTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { approveTransactionInfo, transactionDetails as txDetailsFixture } from 'uniswap/src/test/fixtures'
import { mockApolloClient } from 'uniswap/src/test/mocks'
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
    })

    const hash1 = faker.datatype.uuid()
    const hash2 = faker.datatype.uuid()

    return expectSaga(transactionWatcher, { apolloClient: mockApolloClient })
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
        apolloClient: mockApolloClient,
      })
      .dispatch(addTransaction({ ...approveTxDetailsPending, hash: hash1 }))
      .fork(watchTransaction, {
        transaction: { ...approveTxDetailsPending, hash: hash1 },
        apolloClient: mockApolloClient,
      })
      .dispatch(updateTransaction({ ...approveTxDetailsPending, hash: hash2 }))
      .fork(watchTransaction, {
        transaction: { ...approveTxDetailsPending, hash: hash2 },
        apolloClient: mockApolloClient,
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

    return expectSaga(transactionWatcher, { apolloClient: mockApolloClient })
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
})
