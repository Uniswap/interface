import { BigNumber } from '@ethersproject/bignumber'
import { expectSaga } from 'redux-saga-test-plan'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  ClassicTransactionDetails,
  TransactionReceipt,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { transactionDetails, transactionReceipt } from 'uniswap/src/test/fixtures'
import { getCallsStatusHelper } from 'wallet/src/features/batchedTransactions/eip5792Utils'
import { WalletCallTransaction } from 'wallet/src/features/batchedTransactions/slice'

const ACCOUNT = '0x000000000000000000000000000000000000beef'
const CHAIN_ID = UniverseChainId.Mainnet
const BATCH_ID = '0xbatchbatchbatchbatchbatchbatchbatchbatchbatchbatchbatchbatchbatch'
const USER_OP_HASH = '0xuseropuseropuseropuseropuseropuseropuseropuseropuseropuseropuserop'
const ON_CHAIN_HASH = '0xchainhashchainhashchainhashchainhashchainhashchainhashchainhash'

// EIP-5792 status codes (mirrors values in eip5792Utils.ts)
const STATUS_PENDING = 100
const STATUS_SUCCESS = 200
const STATUS_OFFCHAIN_FAILURE = 400

function buildState(params: {
  batched: WalletCallTransaction
  tx?: ClassicTransactionDetails
}): Record<string, unknown> {
  const { batched, tx } = params
  return {
    batchedTransactions: { [BATCH_ID]: batched },
    transactions: tx
      ? {
          [ACCOUNT]: {
            [CHAIN_ID]: {
              [tx.id]: tx,
            },
          },
        }
      : {},
  }
}

function makeReceipt(): TransactionReceipt {
  return transactionReceipt({
    blockHash: '0xblockhash',
    blockNumber: 12345,
    gasUsed: 21000,
  })
}

describe(getCallsStatusHelper, () => {
  describe('UserOp batches', () => {
    it('returns Pending status while the userOp is still pending', async () => {
      const tx = transactionDetails({
        from: ACCOUNT,
        chainId: CHAIN_ID,
        userOpHash: USER_OP_HASH,
        status: TransactionStatus.Pending,
        receipt: undefined,
      })

      const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
        .withState(
          buildState({
            batched: { chainId: CHAIN_ID, requestId: 'req-1', userOpHash: USER_OP_HASH },
            tx,
          }),
        )
        .run()

      expect(result.returnValue.data?.status).toBe(STATUS_PENDING)
      expect(result.returnValue.data?.receipts).toEqual([])
    })

    it('returns Success status with receipt when userOp lands on-chain successfully', async () => {
      const receipt = makeReceipt()
      const tx = transactionDetails({
        from: ACCOUNT,
        chainId: CHAIN_ID,
        hash: ON_CHAIN_HASH,
        userOpHash: USER_OP_HASH,
        status: TransactionStatus.Success,
        receipt,
      })

      const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
        .withState(
          buildState({
            batched: { chainId: CHAIN_ID, requestId: 'req-1', userOpHash: USER_OP_HASH },
            tx,
          }),
        )
        .run()

      expect(result.returnValue.data?.status).toBe(STATUS_SUCCESS)
      expect(result.returnValue.data?.receipts).toEqual([
        {
          transactionHash: ON_CHAIN_HASH,
          status: '0x1',
          blockHash: receipt.blockHash,
          blockNumber: BigNumber.from(receipt.blockNumber).toHexString(),
          gasUsed: BigNumber.from(receipt.gasUsed).toHexString(),
          logs: [],
        },
      ])
      expect(result.returnValue.data?.capabilities?.caip345?.transactionHashes).toEqual([ON_CHAIN_HASH])
    })

    it('returns OffchainFailure when a userOp is finalized as Failed without a receipt', async () => {
      // This is the bug we're fixing: watcher timed out / bundler dropped the userOp
      // before the chain reported anything back.
      const tx = transactionDetails({
        from: ACCOUNT,
        chainId: CHAIN_ID,
        userOpHash: USER_OP_HASH,
        status: TransactionStatus.Failed,
        receipt: undefined,
        hash: undefined,
      })

      const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
        .withState(
          buildState({
            batched: { chainId: CHAIN_ID, requestId: 'req-1', userOpHash: USER_OP_HASH },
            tx,
          }),
        )
        .run()

      expect(result.returnValue.data?.status).toBe(STATUS_OFFCHAIN_FAILURE)
      // No receipt should be surfaced, and userOpHash must not leak into caip345.transactionHashes
      expect(result.returnValue.data?.receipts).toEqual([])
      expect(result.returnValue.data?.capabilities?.caip345?.transactionHashes).toEqual([])
    })

    it('returns OffchainFailure for other non-Success finalized statuses without a receipt', async () => {
      const tx = transactionDetails({
        from: ACCOUNT,
        chainId: CHAIN_ID,
        userOpHash: USER_OP_HASH,
        status: TransactionStatus.Canceled,
        receipt: undefined,
      })

      const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
        .withState(
          buildState({
            batched: { chainId: CHAIN_ID, requestId: 'req-1', userOpHash: USER_OP_HASH },
            tx,
          }),
        )
        .run()

      expect(result.returnValue.data?.status).toBe(STATUS_OFFCHAIN_FAILURE)
    })

    it('stays Pending in the race window where status is Success but receipt has not landed yet', async () => {
      // updateTransactionWithReceipt may not have populated receipt yet. We must wait
      // for the receipt rather than report Success without on-chain data.
      const tx = transactionDetails({
        from: ACCOUNT,
        chainId: CHAIN_ID,
        userOpHash: USER_OP_HASH,
        status: TransactionStatus.Success,
        receipt: undefined,
      })

      const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
        .withState(
          buildState({
            batched: { chainId: CHAIN_ID, requestId: 'req-1', userOpHash: USER_OP_HASH },
            tx,
          }),
        )
        .run()

      expect(result.returnValue.data?.status).toBe(STATUS_PENDING)
      expect(result.returnValue.data?.receipts).toEqual([])
    })
  })

  describe('txHashes batches', () => {
    it('returns Pending status while the tx is still pending', async () => {
      const tx = transactionDetails({
        from: ACCOUNT,
        chainId: CHAIN_ID,
        hash: ON_CHAIN_HASH,
        status: TransactionStatus.Pending,
        receipt: undefined,
      })

      const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
        .withState(
          buildState({
            batched: { chainId: CHAIN_ID, requestId: 'req-1', txHashes: [ON_CHAIN_HASH] },
            tx,
          }),
        )
        .run()

      expect(result.returnValue.data?.status).toBe(STATUS_PENDING)
    })

    it('returns Success with receipt when the tx mines successfully', async () => {
      const receipt = makeReceipt()
      const tx = transactionDetails({
        from: ACCOUNT,
        chainId: CHAIN_ID,
        hash: ON_CHAIN_HASH,
        status: TransactionStatus.Success,
        receipt,
      })

      const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
        .withState(
          buildState({
            batched: { chainId: CHAIN_ID, requestId: 'req-1', txHashes: [ON_CHAIN_HASH] },
            tx,
          }),
        )
        .run()

      expect(result.returnValue.data?.status).toBe(STATUS_SUCCESS)
      expect(result.returnValue.data?.receipts?.[0]?.transactionHash).toBe(ON_CHAIN_HASH)
    })

    it('returns OffchainFailure when the tx is finalized Failed without a receipt', async () => {
      // e.g. Flashbots offchain failure where the wallet returns early without
      // ever fetching an ethers receipt.
      const tx = transactionDetails({
        from: ACCOUNT,
        chainId: CHAIN_ID,
        hash: ON_CHAIN_HASH,
        status: TransactionStatus.Failed,
        receipt: undefined,
      })

      const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
        .withState(
          buildState({
            batched: { chainId: CHAIN_ID, requestId: 'req-1', txHashes: [ON_CHAIN_HASH] },
            tx,
          }),
        )
        .run()

      expect(result.returnValue.data?.status).toBe(STATUS_OFFCHAIN_FAILURE)
      expect(result.returnValue.data?.receipts).toEqual([])
    })
  })

  it('returns an error when the batch is not found in state', async () => {
    const result = await expectSaga(getCallsStatusHelper, BATCH_ID, ACCOUNT)
      .withState({ batchedTransactions: {}, transactions: {} })
      .run()

    expect(result.returnValue.error).toBe('Batch transaction not found')
    expect(result.returnValue.data).toBeUndefined()
  })
})
