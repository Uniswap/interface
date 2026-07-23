import { TradingApi } from '@universe/api'
import { providers } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  fiatPurchaseTransactionInfo,
  getTxFixtures,
  transactionDetails as transactionDetailsFixture,
} from 'uniswap/src/test/fixtures'
import {
  updateTransactionWithReceipt,
  waitForReceipt,
  waitForTransactionStatus,
} from 'wallet/src/features/transactions/watcher/watchTransactionSaga'

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
  sendAppsFlyerEvent: vi.fn(),
}))

const ACTIVE_ACCOUNT_ADDRESS = '0x000000000000000000000000000000000000000001'
const { ethersTxReceipt, txReceipt, txDetailsPending } = getTxFixtures(
  transactionDetailsFixture({ typeInfo: fiatPurchaseTransactionInfo(), from: ACTIVE_ACCOUNT_ADDRESS }),
)

describe('updateTransactionWithReceipt', () => {
  it('updates transaction with both status Success and receipt when provider returns receipt', async () => {
    const BLOCK_NUMBER = 12345
    const BLOCK_HASH = '0xblockhash'
    const PENDING_HASH = '0xabc123'

    const SUCCESS_RECEIPT: providers.TransactionReceipt = {
      ...ethersTxReceipt,
      status: 1,
      blockNumber: BLOCK_NUMBER,
      blockHash: BLOCK_HASH,
      gasUsed: ethersTxReceipt.gasUsed,
      effectiveGasPrice: ethersTxReceipt.effectiveGasPrice,
    }

    const pendingTx = {
      ...txDetailsPending,
      hash: PENDING_HASH,
    }

    // Transaction status updated by Trading API to Success (but no receipt yet)
    const transactionWithStatus = {
      ...pendingTx,
      status: TransactionStatus.Success,
    }

    const providerMock = {
      waitForTransaction: vi.fn(async () => SUCCESS_RECEIPT),
    } as unknown as providers.Provider

    const result = await expectSaga(updateTransactionWithReceipt, pendingTx, providerMock)
      .withState({
        transactions: {
          [ACTIVE_ACCOUNT_ADDRESS]: {
            [pendingTx.chainId]: {
              [pendingTx.id]: transactionWithStatus,
            },
          },
        },
      })
      .provide([[matchers.call.fn(waitForReceipt), SUCCESS_RECEIPT]])
      .silentRun()

    // Assert the final state contains both status Success and a receipt
    const putActions = result.allEffects.filter((effect: any) => effect.type === 'PUT')
    expect(putActions.length).toBeGreaterThan(0)

    const updateAction = putActions.find(
      (effect: any) => effect.payload?.action?.type === transactionActions.updateTransactionWithoutWatch.type,
    )
    expect(updateAction).toBeDefined()

    const updatedTransaction = updateAction?.payload?.action?.payload
    expect(updatedTransaction.status).toBe(TransactionStatus.Success)
    expect(updatedTransaction.receipt).toBeDefined()
    expect(updatedTransaction.receipt.blockHash).toBe(BLOCK_HASH)
    expect(updatedTransaction.receipt.blockNumber).toBe(BLOCK_NUMBER)
    expect(updatedTransaction.networkFee).toBeDefined()
    expect(updatedTransaction.networkFee.tokenSymbol).toBeDefined()
  })
})

describe(waitForTransactionStatus, () => {
  const USER_OP_HASH = '0xuserop1111111111111111111111111111111111111111111111111111111111'
  const CLASSIC_HASH = '0xclassic111111111111111111111111111111111111111111111111111111111'
  const CHAIN_ID = UniverseChainId.Mainnet

  // Counts fetchSwaps invocations while skipping all delays so the polling loop runs
  // synchronously. Both verify the per-iteration call to the Trading API and confirm
  // the loop iteration count, which is what the maxRetries split is supposed to change.
  function buildPollCounter(): {
    provider: { call: (effect: { fn?: unknown }, next: () => unknown) => unknown }
    getCount: () => number
  } {
    let count = 0
    return {
      getCount: () => count,
      provider: {
        call(effect, next) {
          // typed-redux-saga's delay compiles to call(delayP, ms); skip to keep tests fast.
          if ((effect.fn as { name?: string } | undefined)?.name === 'delayP') {
            return undefined
          }
          if (effect.fn === TradingApiClient.fetchSwaps) {
            count += 1
            return { swaps: [] }
          }
          return next()
        },
      },
    }
  }

  // Keeps the redux store status at Pending so the in-loop selector check doesn't exit early.
  function stateWithPendingTx(tx: { from: string; chainId: number; id: string; status: TransactionStatus }) {
    return {
      transactions: { [tx.from]: { [tx.chainId]: { [tx.id]: tx } } },
    }
  }

  beforeEach(() => {
    vi.mocked(sendAnalyticsEvent).mockClear()
  })

  it('polls /swaps 20 times for UserOps before timing out', async () => {
    const userOpTx = transactionDetailsFixture({
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: CHAIN_ID,
      userOpHash: USER_OP_HASH,
      hash: undefined,
      status: TransactionStatus.Pending,
    })
    const counter = buildPollCounter()

    await expectSaga(waitForTransactionStatus, userOpTx)
      .withState(stateWithPendingTx(userOpTx))
      .provide(counter.provider)
      .run()

    expect(counter.getCount()).toBe(20)
  })

  it('polls /swaps 10 times for classic txs before timing out', async () => {
    const classicTx = transactionDetailsFixture({
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: CHAIN_ID,
      hash: CLASSIC_HASH,
      userOpHash: undefined,
      status: TransactionStatus.Pending,
    })
    const counter = buildPollCounter()

    await expectSaga(waitForTransactionStatus, classicTx)
      .withState(stateWithPendingTx(classicTx))
      .provide(counter.provider)
      .run()

    expect(counter.getCount()).toBe(10)
  })

  // SWAP-2471 (S1): poll-exhaustion telemetry. A classic pending tx whose /swaps polling never
  // resolves to a terminal status hits the `!swapStatus` branch and, because isClassic is true,
  // emits PendingTransactionStuck with reason 'poll_exhausted'.
  it('emits PendingTransactionStuck (poll_exhausted) for a classic tx when polling exhausts', async () => {
    const classicTx = transactionDetailsFixture({
      from: ACTIVE_ACCOUNT_ADDRESS,
      chainId: CHAIN_ID,
      hash: CLASSIC_HASH,
      userOpHash: undefined,
      status: TransactionStatus.Pending,
    })
    const counter = buildPollCounter()

    await expectSaga(waitForTransactionStatus, classicTx)
      .withState(stateWithPendingTx(classicTx))
      .provide(counter.provider)
      .run()

    // Polling exhausted with no terminal status.
    expect(counter.getCount()).toBe(10)

    expect(vi.mocked(sendAnalyticsEvent)).toHaveBeenCalledWith(
      WalletEventName.PendingTransactionStuck,
      expect.objectContaining({ reason: 'poll_exhausted', transaction_id: classicTx.id }),
    )

    // This emit site never probes a chain provider, so provider_knows_tx must be omitted entirely
    // (the builder only includes it when it was actually measured).
    const analyticsCalls = vi.mocked(sendAnalyticsEvent).mock.calls
    const stuckCall = analyticsCalls.find(([eventName]) => eventName === WalletEventName.PendingTransactionStuck)
    expect(stuckCall).toBeDefined()
    const payload = stuckCall?.[1] as Record<string, unknown>
    expect(payload).not.toHaveProperty('provider_knows_tx')
    expect('provider_knows_tx' in payload).toBe(false)
  })

  // Negative: the isClassic guard. A non-classic on-chain tx (BRIDGE) on the same exhausting path
  // must NOT emit PendingTransactionStuck.
  it('does not emit PendingTransactionStuck for a non-classic tx when polling exhausts', async () => {
    const bridgeTx = {
      ...transactionDetailsFixture({
        from: ACTIVE_ACCOUNT_ADDRESS,
        chainId: CHAIN_ID,
        hash: CLASSIC_HASH,
        userOpHash: undefined,
        status: TransactionStatus.Pending,
      }),
      routing: TradingApi.Routing.BRIDGE,
    } as unknown as Parameters<typeof waitForTransactionStatus>[0]
    const counter = buildPollCounter()

    await expectSaga(waitForTransactionStatus, bridgeTx)
      .withState(stateWithPendingTx(bridgeTx))
      .provide(counter.provider)
      .run()

    // Same exhausting poll path as the classic case.
    expect(counter.getCount()).toBe(10)

    expect(vi.mocked(sendAnalyticsEvent)).not.toHaveBeenCalledWith(
      WalletEventName.PendingTransactionStuck,
      expect.anything(),
    )
  })
})
