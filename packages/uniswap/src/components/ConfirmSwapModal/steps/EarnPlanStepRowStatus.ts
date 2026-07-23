import { TradingApi } from '@universe/api'
import type { TFunction } from 'i18next'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { logger } from 'utilities/src/logger/logger'

export type EarnPlanStepType = TradingApi.PlanStepType.VAULT_DEPOSIT | TradingApi.PlanStepType.VAULT_WITHDRAW

export function isEarnPlanStepType(stepType: TradingApi.PlanStepType | undefined): stepType is EarnPlanStepType {
  return stepType === TradingApi.PlanStepType.VAULT_DEPOSIT || stepType === TradingApi.PlanStepType.VAULT_WITHDRAW
}

type EarnPlanStepTitleState = 'idle' | 'pending' | 'completed'

export function getEarnPlanStepTitle({
  status,
  stepType,
  symbol,
  t,
}: {
  status: StepStatus
  stepType: EarnPlanStepType
  symbol: string | undefined
  t: TFunction
}): string {
  const titleState = getEarnPlanStepTitleState(status)

  if (stepType === TradingApi.PlanStepType.VAULT_DEPOSIT) {
    return getEarnDepositStepTitle({ titleState, symbol, t })
  }

  return getEarnWithdrawStepTitle({ titleState, symbol, t })
}

function getEarnPlanStepTitleState(status: StepStatus): EarnPlanStepTitleState {
  switch (status) {
    case StepStatus.InProgress:
      return 'pending'
    case StepStatus.Complete:
      return 'completed'
    case StepStatus.Preview:
    case StepStatus.Active:
    case StepStatus.Failed:
    case StepStatus.Replaced:
      return 'idle'
    default:
      logger.warn('EarnPlanStepRowStatus', 'getEarnPlanStepTitleState', 'Unknown status', status)
      return 'idle'
  }
}

function getEarnDepositStepTitle({
  titleState,
  symbol,
  t,
}: {
  titleState: EarnPlanStepTitleState
  symbol: string | undefined
  t: TFunction
}): string {
  switch (titleState) {
    case 'pending':
      return symbol
        ? t('explore.earn.review.deposit.pending', { symbol })
        : t('explore.earn.review.deposit.pendingFallback')
    case 'completed':
      return symbol
        ? t('explore.earn.review.deposit.completed', { symbol })
        : t('explore.earn.review.deposit.completedFallback')
    case 'idle':
      return symbol ? t('explore.earn.review.deposit.idle', { symbol }) : t('explore.earn.review.deposit.idleFallback')
  }

  logger.warn('EarnPlanStepRowStatus', 'getEarnDepositStepTitle', 'Unknown title state', titleState)
  return symbol ? t('explore.earn.review.deposit.idle', { symbol }) : t('explore.earn.review.deposit.idleFallback')
}

function getEarnWithdrawStepTitle({
  titleState,
  symbol,
  t,
}: {
  titleState: EarnPlanStepTitleState
  symbol: string | undefined
  t: TFunction
}): string {
  switch (titleState) {
    case 'pending':
      return symbol
        ? t('explore.earn.review.withdraw.pending', { symbol })
        : t('explore.earn.review.withdraw.pendingFallback')
    case 'completed':
      return symbol
        ? t('explore.earn.review.withdraw.completed', { symbol })
        : t('explore.earn.review.withdraw.completedFallback')
    case 'idle':
      return symbol
        ? t('explore.earn.review.withdraw.idle', { symbol })
        : t('explore.earn.review.withdraw.idleFallback')
  }

  logger.warn('EarnPlanStepRowStatus', 'getEarnWithdrawStepTitle', 'Unknown title state', titleState)
  return symbol ? t('explore.earn.review.withdraw.idle', { symbol }) : t('explore.earn.review.withdraw.idleFallback')
}
