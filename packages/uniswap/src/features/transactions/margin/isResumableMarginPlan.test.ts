import { isResumableMarginPlan } from 'uniswap/src/features/transactions/margin/isResumableMarginPlan'
import {
  type PlanTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { describe, expect, it } from 'vitest'

const marginAction = { action: 'open', collateralCurrencyId: '1-0xa', debtCurrencyId: '1-0xb' } as const
const plan = (overrides: Partial<PlanTransactionInfo> = {}): PlanTransactionInfo =>
  ({
    type: TransactionType.Plan,
    planId: 'plan-id',
    stepDetails: [],
    marginAction,
    ...overrides,
  }) as PlanTransactionInfo
const stepInFlight = { status: TransactionStatus.Pending } as PlanTransactionInfo['stepDetails'][number]

describe(isResumableMarginPlan, () => {
  it.each([
    ['awaiting action', plan(), TransactionStatus.AwaitingAction, true],
    ['pending', plan(), TransactionStatus.Pending, true],
    ['a step tx in flight', plan({ stepDetails: [stepInFlight] }), TransactionStatus.Pending, false],
    ['failed', plan(), TransactionStatus.Failed, false],
    ['completed', plan(), TransactionStatus.Success, false],
    ['a swap plan', plan({ marginAction: undefined }), TransactionStatus.AwaitingAction, false],
  ])('%s → %s', (_, typeInfo, status, expected) => {
    expect(isResumableMarginPlan(typeInfo, status)).toBe(expected)
  })
})
