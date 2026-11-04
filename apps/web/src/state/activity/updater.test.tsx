import { permit2Address } from '@uniswap/permit2-sdk'
import { UniverseChainId } from '@universe/chains'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import type {
  BridgeTransactionInfo,
  PlanTransactionDetails,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  ApproveTransactionInfo,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ActivityUpdateTransactionType } from '~/state/activity/types'
import { canFinalizeBaseTransactionUpdate, useOnActivityUpdate } from '~/state/activity/updater'
import type { PendingTransactionDetails } from '~/state/transactions/types'
import { act } from '~/test-utils/render'
import { renderHookWithProviders } from '~/test-utils/renderHookWithProviders'
import { popupRegistry } from '~/utils/popups/registry'

vi.mock('@universe/gating', async () => {
  const actual = await vi.importActual('@universe/gating')
  return { ...actual, useFeatureFlag: () => false }
})

vi.mock('~/state/activity/useHandleUniswapXActivityUpdate', () => ({ useHandleUniswapXActivityUpdate: () => vi.fn() }))

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
      stepDetails: [],
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

  describe('tracked UniswapX cancel tx finalization', () => {
    const CANCEL_HASH = '0xcanceltxhash'
    const cancelInfo = { type: TransactionType.UniswapXCancel, orderHashes: ['0xorderhash'] } as const
    const receipt = {
      transactionIndex: 0,
      blockHash: '0xblock',
      blockNumber: 1,
      confirmedTime: Date.now(),
      gasUsed: 45_000,
      effectiveGasPrice: 1,
    }

    function makeCancelTx(): PendingTransactionDetails {
      return {
        ...makePendingTx(),
        id: CANCEL_HASH,
        hash: CANCEL_HASH,
        typeInfo: cancelInfo,
      } as PendingTransactionDetails
    }

    it('remaps a Success receipt to Canceled and suppresses the finalize popup', () => {
      const original = makeCancelTx()
      const { result, store } = renderOnActivityUpdate(original)
      const popupKeys: string[] = []
      const removeListener = popupRegistry.addListener((_content, key) => {
        popupKeys.push(key)
        return key
      })

      try {
        act(() => {
          result.current({
            type: ActivityUpdateTransactionType.BaseTransaction,
            chainId: CHAIN_ID,
            original,
            update: { status: TransactionStatus.Success, hash: CANCEL_HASH, typeInfo: cancelInfo, receipt },
          })
        })

        const storedTx = getTxs(store)[CANCEL_HASH]
        expect(storedTx.status).toBe(TransactionStatus.Canceled)
        expect(popupKeys).toEqual([])
        // Registered as a plain hash tx — never batchInfo
        expect((storedTx as { batchInfo?: unknown } | undefined)?.batchInfo).toBeUndefined()
      } finally {
        removeListener()
      }
    })

    it('finalizes a reverted cancel tx as Failed (no remap)', () => {
      const original = makeCancelTx()
      const { result, store } = renderOnActivityUpdate(original)

      act(() => {
        result.current({
          type: ActivityUpdateTransactionType.BaseTransaction,
          chainId: CHAIN_ID,
          original,
          update: { status: TransactionStatus.Failed, hash: CANCEL_HASH, typeInfo: cancelInfo, receipt },
        })
      })

      expect(getTxs(store)[CANCEL_HASH]?.status).toBe(TransactionStatus.Failed)
    })
  })

  describe('bridge deposit confirmation', () => {
    const BRIDGE_HASH = '0xbridgetxhash'
    const bridgeInfo: BridgeTransactionInfo = {
      type: TransactionType.Bridge,
      inputCurrencyId: `${CHAIN_ID}-${USDC_MAINNET.address}`,
      inputCurrencyAmountRaw: '1000000',
      outputCurrencyId: `${UniverseChainId.ArbitrumOne}-${USDC_MAINNET.address}`,
      outputCurrencyAmountRaw: '1000000',
    }

    function makeBridgeTx(): PendingTransactionDetails {
      return {
        ...makePendingTx(),
        id: BRIDGE_HASH,
        hash: BRIDGE_HASH,
        typeInfo: bridgeInfo,
      } as PendingTransactionDetails
    }

    // Exercises the wiring end-to-end at the poller seam: an update shaped like
    // usePollPendingTransactions' output (receipt-derived networkFee included) must land in the
    // persisted transaction via interfaceConfirmBridgeDeposit, since the later cross-chain
    // finalization is status-only and never sees a receipt.
    it('persists the deposit receipt network fee while keeping the bridge tx pending', () => {
      const original = makeBridgeTx()
      const { result, store } = renderOnActivityUpdate(original)
      const networkFee = {
        quantity: '0.000042',
        tokenSymbol: 'ETH',
        tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        chainId: CHAIN_ID,
        valueType: ValueType.Exact,
      }

      act(() => {
        result.current({
          type: ActivityUpdateTransactionType.BaseTransaction,
          chainId: CHAIN_ID,
          original,
          update: {
            status: TransactionStatus.Success,
            typeInfo: bridgeInfo,
            receipt: {
              transactionIndex: 0,
              blockHash: '0xblock',
              blockNumber: 1,
              confirmedTime: Date.now(),
              gasUsed: 21_000,
              effectiveGasPrice: 2_000_000_000,
            },
            hash: BRIDGE_HASH,
            networkFee,
          },
        })
      })

      const storedTx = getTxs(store)[BRIDGE_HASH] as TransactionDetails | undefined
      expect((storedTx?.typeInfo as BridgeTransactionInfo).depositConfirmed).toBe(true)
      expect(storedTx?.networkFee).toEqual(networkFee)
      // The bridge stays pending until the cross-chain leg confirms
      expect(storedTx?.status).toBe(TransactionStatus.Pending)
    })
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
