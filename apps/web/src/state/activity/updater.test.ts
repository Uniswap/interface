import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { addTransaction, deleteTransaction } from 'uniswap/src/features/transactions/slice'
import type { ActivePlanData } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import type { PlanTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import store from '~/state'
import { shouldAddTransactionPopup } from '~/state/activity/updater'
import type { TransactionDetails } from '~/state/transactions/types'

const PLAN_ID = 'plan-id'
const ADDRESS = '0x0000000000000000000000000000000000000001' as Address

function createTransaction(planId?: string): TransactionDetails {
  return {
    batchInfo: {
      batchId: 'batch-id',
      chainId: 1,
      connectorId: 'test-connector',
      planId,
    },
  } as TransactionDetails
}

function createPlanTransaction(status: TransactionStatus = TransactionStatus.Pending): PlanTransactionDetails {
  return {
    id: PLAN_ID,
    chainId: UniverseChainId.Mainnet,
    from: ADDRESS,
    status,
    updatedTime: Date.now(),
    typeInfo: {
      type: TransactionType.Plan,
      planId: PLAN_ID,
    },
  } as PlanTransactionDetails
}

describe(shouldAddTransactionPopup, () => {
  afterEach(() => {
    activePlanStore.setState({ activePlan: undefined, backgroundedPlans: {} })

    if (store.getState().transactions[ADDRESS]?.[UniverseChainId.Mainnet]?.[PLAN_ID]) {
      store.dispatch(deleteTransaction({ address: ADDRESS, chainId: UniverseChainId.Mainnet, id: PLAN_ID }))
    }
  })

  it('skips the finalized transaction popup while the plan is active', () => {
    activePlanStore.setState({ activePlan: { planId: PLAN_ID } as ActivePlanData })

    expect(shouldAddTransactionPopup({ hash: '0xhash', original: createTransaction(PLAN_ID) })).toBe(false)
  })

  it('skips the finalized transaction popup when a pollable pending plan transaction is persisted', () => {
    store.dispatch(addTransaction(createPlanTransaction()))

    expect(shouldAddTransactionPopup({ hash: '0xhash', original: createTransaction(PLAN_ID) })).toBe(false)
  })

  it.each([TransactionStatus.AwaitingAction, TransactionStatus.Failed, TransactionStatus.Success])(
    'keeps the finalized transaction popup when a persisted plan is %s after reload',
    (status) => {
      store.dispatch(addTransaction(createPlanTransaction(status)))

      expect(shouldAddTransactionPopup({ hash: '0xhash', original: createTransaction(PLAN_ID) })).toBe(true)
    },
  )

  it('keeps the finalized transaction popup for an orphaned plan batch after reload', () => {
    expect(shouldAddTransactionPopup({ hash: '0xhash', original: createTransaction(PLAN_ID) })).toBe(true)
  })

  it('keeps the finalized transaction popup for a normal batch', () => {
    expect(shouldAddTransactionPopup({ hash: '0xhash', original: createTransaction() })).toBe(true)
  })

  it('does not add a popup without a finalized hash', () => {
    expect(shouldAddTransactionPopup({ hash: undefined, original: createTransaction() })).toBe(false)
  })
})
