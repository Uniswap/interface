import { Web3Provider } from '@ethersproject/providers'
import { permit2Address } from '@uniswap/permit2-sdk'
import { UniverseChainId } from '@universe/chains'
import { getPublicClient } from '@wagmi/core'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import {
  ApproveTransactionInfo,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import type { Mock } from 'vitest'
import type { GetCallsStatusResult } from 'wallet/src/features/dappRequests/types'
import { pollPendingBatches } from '~/state/activity/polling/batch'
import { ActivityUpdateTransactionType } from '~/state/activity/types'

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('~/connection/wagmiConfig', () => ({
  wagmiConfig: {},
}))

vi.mock('@wagmi/core', () => ({
  getPublicClient: vi.fn(),
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

describe('pollPendingBatches when wallet_getCallsStatus errors', () => {
  const ONCHAIN_HASH = `0x${'ab'.repeat(32)}`

  type WalletResponse = 'error' | 'pending' | 'confirmed'

  /** Answers each poll from the script, then keeps reporting the batch confirmed */
  function makeScriptedProvider(script: WalletResponse[]): Web3Provider {
    let call = 0
    return {
      send: vi.fn(async () => {
        const response = script[call++] ?? 'confirmed'
        if (response === 'error') {
          throw new Error('wallet_getCallsStatus timed out')
        }
        return response === 'pending'
          ? makeResult({ status: 100 })
          : makeResult({ status: 200, receipts: [receiptOf(ONCHAIN_HASH)] })
      }),
    } as unknown as Web3Provider
  }

  /** Mirrors the 1s poll interval: polls until the batch is finalized (and so leaves the pending set) */
  async function pollUntilFinalized(params: { provider: Web3Provider; tx: PendingBatch; maxPolls: number }) {
    const onActivityUpdate = vi.fn()
    for (let poll = 1; poll <= params.maxPolls; poll++) {
      await pollPendingBatches({ provider: params.provider, transactions: [params.tx], onActivityUpdate })
      if (onActivityUpdate.mock.calls.length > 0) {
        return { onActivityUpdate, finalizedAtPoll: poll }
      }
    }
    return { onActivityUpdate, finalizedAtPoll: undefined }
  }

  function mockReceiptLookup(lookup: () => Promise<{ status: 'success' | 'reverted' }>) {
    const getTransactionReceipt = vi.fn(lookup)
    ;(getPublicClient as Mock).mockReturnValue({ getTransactionReceipt })
    return getTransactionReceipt
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockReceiptLookup(() => Promise.reject(new Error('TransactionReceiptNotFoundError')))
  })

  it('does not fail a batch over a brief run of errors once the wallet recovers', async () => {
    const provider = makeScriptedProvider(['error', 'error', 'error', 'error', 'error'])

    const { onActivityUpdate, finalizedAtPoll } = await pollUntilFinalized({
      provider,
      tx: makeBatchTx('0xbatchBriefOutage'),
      maxPolls: 10,
    })

    expect(finalizedAtPoll).toBe(6)
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Success, hash: ONCHAIN_HASH }),
      }),
    )
  })

  it('only counts consecutive errors toward giving up', async () => {
    const scattered: WalletResponse[] = Array.from({ length: 40 }, (_, i) => (i % 2 === 0 ? 'error' : 'pending'))
    const provider = makeScriptedProvider(scattered)

    const { onActivityUpdate, finalizedAtPoll } = await pollUntilFinalized({
      provider,
      tx: makeBatchTx('0xbatchScatteredErrors'),
      maxPolls: 50,
    })

    expect(finalizedAtPoll).toBe(41)
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ status: TransactionStatus.Success }) }),
    )
  })

  it('resolves from the on-chain receipt when the wallet keeps erroring and the tx hash is known', async () => {
    const getTransactionReceipt = mockReceiptLookup(async () => ({ status: 'success' }))
    const provider = makeProvider({ '0xbatchCaip345': new Error('wallet_getCallsStatus timed out') })
    const tx = { ...makeBatchTx('0xbatchCaip345'), hash: ONCHAIN_HASH }

    const { onActivityUpdate, finalizedAtPoll } = await pollUntilFinalized({ provider, tx, maxPolls: 10 })

    expect(finalizedAtPoll).toBe(4)
    expect(getTransactionReceipt).toHaveBeenCalledWith({ hash: ONCHAIN_HASH })
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Success, hash: ONCHAIN_HASH }),
      }),
    )
  })

  it('finalizes as failed when the on-chain receipt reverted', async () => {
    mockReceiptLookup(async () => ({ status: 'reverted' }))
    const provider = makeProvider({ '0xbatchReverted': new Error('wallet_getCallsStatus timed out') })
    const tx = { ...makeBatchTx('0xbatchReverted'), hash: ONCHAIN_HASH }

    const { onActivityUpdate } = await pollUntilFinalized({ provider, tx, maxPolls: 10 })

    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Failed, hash: ONCHAIN_HASH }),
      }),
    )
  })

  it('keeps a batch with a known tx hash pending while the tx is unmined', async () => {
    const provider = makeProvider({ '0xbatchUnmined': new Error('wallet_getCallsStatus timed out') })
    const tx = { ...makeBatchTx('0xbatchUnmined'), hash: ONCHAIN_HASH }

    const { onActivityUpdate } = await pollUntilFinalized({ provider, tx, maxPolls: 60 })

    expect(onActivityUpdate).not.toHaveBeenCalled()
  })

  it('gives up as failed after a sustained outage when there is no tx hash to check', async () => {
    const provider = makeProvider({ '0xbatchNoHash': new Error('wallet_getCallsStatus timed out') })

    const { onActivityUpdate, finalizedAtPoll } = await pollUntilFinalized({
      provider,
      tx: makeBatchTx('0xbatchNoHash'),
      maxPolls: 60,
    })

    expect(finalizedAtPoll).toBe(30)
    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Failed, hash: undefined }),
      }),
    )
  })
})
