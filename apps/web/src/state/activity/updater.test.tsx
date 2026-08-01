import { permit2Address } from '@uniswap/permit2-sdk'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import type { PlanTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  ApproveTransactionInfo,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ActivityUpdateTransactionType } from '~/state/activity/types'
import { canFinalizeBaseTransactionUpdate, useOnActivityUpdate } from '~/state/activity/updater'
import { popupRegistry } from '~/state/popups/registry'
import type { PendingTransactionDetails } from '~/state/transactions/types'
import { act } from '~/test-utils/render'
import { renderHookWithProviders } from '~/test-utils/renderHookWithProviders'

vi.mock('@universe/gating', async () => {
  const actual = await vi.importActual('@universe/gating')
  return { ...actual, useFeatureFlag: () => false }
})

vi.mock('uniswap/src/features/earn/hooks/useIsEarnEnabled', () => ({ useIsEarnEnabled: () => false }))

vi.mock('~/hooks/useHandleUniswapXActivityUpdate', () => ({ useHandleUniswapXActivityUpdate: () => vi.fn() }))

const CHAIN_ID = UniverseChainId.Mainnet
const ADDRESS = '0x0000000000000000000000000000000000000001'
const BATCH_ID = '0xbatchid'
const PLAN_ID = 'delivered-plan-id'

const approveInfo: ApproveTransactionInfo = {
  type: TransactionType.Approve,
  tokenAddress: USDC_MAINNET.address,
  spender: permit2Address(CHAIN_ID),
  approvalAmount: '1000000',
}

function makePendingTx(params?: { batch?: boolean; planId?: string }): PendingTransactionDetails {
  return {
    id: BATCH_ID,
    hash: BATCH_ID,
    chainId: CHAIN_ID,
    from: ADDRESS,
    typeInfo: approveInfo,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: { from: ADDRESS, chainId: CHAIN_ID } },
    ...(params?.batch
      ? { batchInfo: { connectorId: 'test-connector', batchId: BATCH_ID, chainId: CHAIN_ID, planId: params.planId } }
      : {}),
  } as PendingTransactionDetails
}

function makePlan(status: TransactionStatus): PlanTransactionDetails {
  return {
    id: PLAN_ID,
    chainId: CHAIN_ID,
    from: ADDRESS,
    status,
    addedTime: Date.now(),
    updatedTime: Date.now(),
    typeInfo: {
      type: TransactionType.Plan,
      planId: PLAN_ID,
    },
  } as PlanTransactionDetails
}

function renderOnActivityUpdate(original: PendingTransactionDetails) {
  const { result, store } = renderHookWithProviders(() => useOnActivityUpdate())
  act(() => {
    store.dispatch(addTransaction(original))
  })
  return { result, store }
}

function getTxs(store: { getState: () => any }): Record<string, { status: TransactionStatus; hash?: string }> {
  return store.getState().transactions[ADDRESS]?.[CHAIN_ID] ?? {}
}

describe('useOnActivityUpdate', () => {
  it('keeps the plan as notification owner after its completion popup is dismissed', () => {
    const original = makePendingTx({ batch: true, planId: PLAN_ID })
    const { result, store } = renderOnActivityUpdate(original)
    const popupKeys: string[] = []
    const removeListener = popupRegistry.addListener((_content, key) => {
      popupKeys.push(key)
      return key
    })

    try {
      act(() => {
        store.dispatch(addTransaction(makePlan(TransactionStatus.Pending)))
        result.current({
          type: ActivityUpdateTransactionType.Plan,
          chainId: CHAIN_ID,
          update: makePlan(TransactionStatus.Success),
        })
      })
      popupRegistry.removePopup(PLAN_ID)

      act(() => {
        result.current({
          type: ActivityUpdateTransactionType.BaseTransaction,
          chainId: CHAIN_ID,
          original,
          update: { status: TransactionStatus.Success, hash: '0xdeadbeef', typeInfo: approveInfo },
        })
      })

      expect(popupKeys).toEqual([PLAN_ID])
    } finally {
      removeListener()
      popupRegistry.removePopup(PLAN_ID)
    }
  })

  it('finalizes a failed batch transaction that has no receipt and no hash', () => {
    const original = makePendingTx({ batch: true })
    const { result, store } = renderOnActivityUpdate(original)

    act(() => {
      result.current({
        type: ActivityUpdateTransactionType.BaseTransaction,
        chainId: CHAIN_ID,
        original,
        update: { status: TransactionStatus.Failed, typeInfo: approveInfo },
      })
    })

    expect(getTxs(store)[BATCH_ID]?.status).toBe(TransactionStatus.Failed)
  })

  it('finalizes a failed batch transaction under its new id after the hash re-key', () => {
    const original = makePendingTx({ batch: true })
    const { result, store } = renderOnActivityUpdate(original)
    const onChainHash = '0xdeadbeef'

    act(() => {
      result.current({
        type: ActivityUpdateTransactionType.BaseTransaction,
        chainId: CHAIN_ID,
        original,
        update: { status: TransactionStatus.Failed, hash: onChainHash, typeInfo: approveInfo },
      })
    })

    const txs = getTxs(store)
    expect(txs[BATCH_ID]).toBeUndefined()
    expect(txs[onChainHash]?.status).toBe(TransactionStatus.Failed)
    expect(txs[onChainHash]?.hash).toBe(onChainHash)
  })

  it('does not finalize a failed non-batch transaction without a receipt', () => {
    const original = makePendingTx()
    const { result, store } = renderOnActivityUpdate(original)

    act(() => {
      result.current({
        type: ActivityUpdateTransactionType.BaseTransaction,
        chainId: CHAIN_ID,
        original,
        update: { status: TransactionStatus.Failed, typeInfo: approveInfo },
      })
    })

    expect(getTxs(store)[BATCH_ID]?.status).toBe(TransactionStatus.Pending)
  })
})

describe('canFinalizeBaseTransactionUpdate', () => {
  it('allows a failed batch update without a receipt', () => {
    expect(
      canFinalizeBaseTransactionUpdate({
        original: makePendingTx({ batch: true }),
        update: { status: TransactionStatus.Failed, typeInfo: approveInfo },
      }),
    ).toBe(true)
  })

  it('still rejects a hashless batch update that is not failed', () => {
    expect(
      canFinalizeBaseTransactionUpdate({
        original: makePendingTx({ batch: true }),
        update: { status: TransactionStatus.Success, typeInfo: approveInfo },
      }),
    ).toBe(false)
  })
})
