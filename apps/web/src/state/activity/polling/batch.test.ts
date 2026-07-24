import { Web3Provider } from '@ethersproject/providers'
import { permit2Address } from '@uniswap/permit2-sdk'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  ApproveTransactionInfo,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { GetCallsStatusResult } from 'wallet/src/features/dappRequests/types'
import { pollPendingBatches } from '~/state/activity/polling/batch'
import { ActivityUpdateTransactionType } from '~/state/activity/types'

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const CHAIN_ID = UniverseChainId.Mainnet
const ADDRESS = '0x0000000000000000000000000000000000000001'

const approveInfo: ApproveTransactionInfo = {
  type: TransactionType.Approve,
  tokenAddress: USDC_MAINNET.address,
  spender: permit2Address(CHAIN_ID),
  approvalAmount: '1000000',
}

type PendingBatch = Parameters<typeof pollPendingBatches>[0]['transactions'][number]

function makeBatchTx(batchId: string): PendingBatch {
  return {
    id: batchId,
    hash: batchId,
    chainId: CHAIN_ID,
    from: ADDRESS,
    typeInfo: approveInfo,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: { from: ADDRESS, chainId: CHAIN_ID } },
    batchInfo: { connectorId: 'test-connector', batchId, chainId: CHAIN_ID },
  } as PendingBatch
}

function makeProvider(resultsByBatchId: Record<string, GetCallsStatusResult | Error>): Web3Provider {
  return {
    send: vi.fn(async (_method: string, [batchId]: [string]) => {
      const result = resultsByBatchId[batchId]
      if (result instanceof Error) {
        throw result
      }
      return result
    }),
  } as unknown as Web3Provider
}

function makeResult(overrides: Partial<GetCallsStatusResult>): GetCallsStatusResult {
  return { version: '2.0.0', id: '0xbatch', chainId: '0x1', status: 100, ...overrides }
}

function receiptOf(transactionHash: string, status: '0x1' | '0x0' = '0x1') {
  return { transactionHash, status, logs: [] }
}

describe('pollPendingBatches', () => {
  it('finalizes status 600 (partial revert) as failed with the receipt hash', async () => {
    const onActivityUpdate = vi.fn()
    const tx = makeBatchTx('0xbatch600')
    const provider = makeProvider({
      '0xbatch600': makeResult({ status: 600, atomic: false, receipts: [receiptOf('0xdead', '0x0')] }),
    })

    await pollPendingBatches({ provider, transactions: [tx], onActivityUpdate })

    expect(onActivityUpdate).toHaveBeenCalledTimes(1)
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ActivityUpdateTransactionType.BaseTransaction,
        update: expect.objectContaining({ status: TransactionStatus.Failed, hash: '0xdead' }),
      }),
    )
  })

  it('finalizes a receipt-less failure (status 400) as failed with no hash', async () => {
    const onActivityUpdate = vi.fn()
    const tx = makeBatchTx('0xbatch400')
    const provider = makeProvider({ '0xbatch400': makeResult({ status: 400 }) })

    await pollPendingBatches({ provider, transactions: [tx], onActivityUpdate })

    expect(onActivityUpdate).toHaveBeenCalledTimes(1)
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Failed, hash: undefined }),
      }),
    )
  })

  it('keeps processing the remaining batches after one fails', async () => {
    const onActivityUpdate = vi.fn()
    const failed = makeBatchTx('0xbatchFailedFirst')
    const confirmed = makeBatchTx('0xbatchConfirmedSecond')
    const provider = makeProvider({
      '0xbatchFailedFirst': makeResult({ status: 500 }),
      '0xbatchConfirmedSecond': makeResult({ status: 200, receipts: [receiptOf('0xbeef')] }),
    })

    await pollPendingBatches({ provider, transactions: [failed, confirmed], onActivityUpdate })

    expect(onActivityUpdate).toHaveBeenCalledTimes(2)
    expect(onActivityUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Success, hash: '0xbeef' }),
      }),
    )
  })

  it('uses the last receipt when the batch executed non-atomically with multiple receipts', async () => {
    const onActivityUpdate = vi.fn()
    const tx = makeBatchTx('0xbatchNonAtomic')
    const provider = makeProvider({
      '0xbatchNonAtomic': makeResult({
        status: 200,
        atomic: false,
        receipts: [receiptOf('0xapproval'), receiptOf('0xmain')],
      }),
    })

    await pollPendingBatches({ provider, transactions: [tx], onActivityUpdate })

    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Success, hash: '0xmain' }),
      }),
    )
  })

  it('uses the first receipt for atomic execution', async () => {
    const onActivityUpdate = vi.fn()
    const tx = makeBatchTx('0xbatchAtomic')
    const provider = makeProvider({
      '0xbatchAtomic': makeResult({ status: 200, atomic: true, receipts: [receiptOf('0xonly'), receiptOf('0xextra')] }),
    })

    await pollPendingBatches({ provider, transactions: [tx], onActivityUpdate })

    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Success, hash: '0xonly' }),
      }),
    )
  })

  it('does not finalize a still-pending batch (status 100)', async () => {
    const onActivityUpdate = vi.fn()
    const tx = makeBatchTx('0xbatchPending')
    const provider = makeProvider({ '0xbatchPending': makeResult({ status: 100 }) })

    await pollPendingBatches({ provider, transactions: [tx], onActivityUpdate })

    expect(onActivityUpdate).not.toHaveBeenCalled()
  })
})
