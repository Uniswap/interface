import { TradingApi } from '@universe/api'
import type { TFunction } from 'i18next'
import {
  getEarnPlanStepTitle,
  isEarnPlanStepType,
} from 'uniswap/src/components/ConfirmSwapModal/steps/EarnPlanStepRowStatus'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { describe, expect, it } from 'vitest'

const translations: Record<string, string> = {
  'explore.earn.review.deposit.completed': 'Deposited {{symbol}} to Earn',
  'explore.earn.review.deposit.completedFallback': 'Deposited to Earn',
  'explore.earn.review.deposit.idle': 'Deposit {{symbol}} to Earn',
  'explore.earn.review.deposit.idleFallback': 'Deposit to Earn',
  'explore.earn.review.deposit.pending': 'Depositing {{symbol}} to Earn',
  'explore.earn.review.deposit.pendingFallback': 'Depositing to Earn',
  'explore.earn.review.withdraw.completed': 'Withdrew {{symbol}} from Earn',
  'explore.earn.review.withdraw.completedFallback': 'Withdrew from Earn',
  'explore.earn.review.withdraw.idle': 'Withdraw {{symbol}} from Earn',
  'explore.earn.review.withdraw.idleFallback': 'Withdraw from Earn',
  'explore.earn.review.withdraw.pending': 'Withdrawing {{symbol}} from Earn',
  'explore.earn.review.withdraw.pendingFallback': 'Withdrawing from Earn',
}

const t = ((key: string, params?: Record<string, string>): string => {
  const translation = translations[key] ?? key
  return translation.replace('{{symbol}}', params?.['symbol'] ?? '')
}) as unknown as TFunction

describe(getEarnPlanStepTitle, () => {
  it('returns deposit step titles by status', () => {
    expect(
      getEarnPlanStepTitle({
        status: StepStatus.Active,
        stepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
        symbol: 'USDC',
        t,
      }),
    ).toBe('Deposit USDC to Earn')
    expect(
      getEarnPlanStepTitle({
        status: StepStatus.InProgress,
        stepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
        symbol: 'USDC',
        t,
      }),
    ).toBe('Depositing USDC to Earn')
    expect(
      getEarnPlanStepTitle({
        status: StepStatus.Complete,
        stepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
        symbol: 'USDC',
        t,
      }),
    ).toBe('Deposited USDC to Earn')
  })

  it('returns withdraw step titles by status', () => {
    expect(
      getEarnPlanStepTitle({
        status: StepStatus.Active,
        stepType: TradingApi.PlanStepType.VAULT_WITHDRAW,
        symbol: 'USDC',
        t,
      }),
    ).toBe('Withdraw USDC from Earn')
    expect(
      getEarnPlanStepTitle({
        status: StepStatus.InProgress,
        stepType: TradingApi.PlanStepType.VAULT_WITHDRAW,
        symbol: 'USDC',
        t,
      }),
    ).toBe('Withdrawing USDC from Earn')
    expect(
      getEarnPlanStepTitle({
        status: StepStatus.Complete,
        stepType: TradingApi.PlanStepType.VAULT_WITHDRAW,
        symbol: 'USDC',
        t,
      }),
    ).toBe('Withdrew USDC from Earn')
  })

  it('omits the token symbol when currency metadata is unavailable', () => {
    expect(
      getEarnPlanStepTitle({
        status: StepStatus.Active,
        stepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
        symbol: undefined,
        t,
      }),
    ).toBe('Deposit to Earn')

    expect(
      getEarnPlanStepTitle({
        status: StepStatus.InProgress,
        stepType: TradingApi.PlanStepType.VAULT_WITHDRAW,
        symbol: undefined,
        t,
      }),
    ).toBe('Withdrawing from Earn')
  })
})

describe(isEarnPlanStepType, () => {
  it('identifies vault plan steps', () => {
    expect(isEarnPlanStepType(TradingApi.PlanStepType.VAULT_DEPOSIT)).toBe(true)
    expect(isEarnPlanStepType(TradingApi.PlanStepType.VAULT_WITHDRAW)).toBe(true)
    expect(isEarnPlanStepType(TradingApi.PlanStepType.CLASSIC)).toBe(false)
  })
})
