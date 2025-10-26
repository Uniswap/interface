import { providers } from 'ethers'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
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
} from 'wallet/src/features/transactions/watcher/watchTransactionSaga'

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
      waitForTransaction: jest.fn(async () => SUCCESS_RECEIPT),
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
