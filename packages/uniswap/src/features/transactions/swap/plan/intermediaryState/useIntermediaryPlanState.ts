import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useCanResumePlan } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useCanResumePlan'
import {
  extractTransactionTypeInfoAttribute,
  PlanTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export interface IntermediaryPlanState {
  inputCurrency?: Currency
  intermediaryCurrencyAmount?: CurrencyAmount<Currency>
  hasSwapped: boolean
  hasBridged: boolean
}

export function useIntermediaryPlanState({
  typeInfo,
  status,
}: {
  typeInfo: PlanTransactionInfo
  status: TransactionStatus
}): IntermediaryPlanState {
  const inputCurrency = useCurrencyInfo(typeInfo.inputCurrencyId)?.currency ?? undefined
  const canResumePlan = useCanResumePlan(typeInfo, status)

  const skipIntermediaryCheck = !canResumePlan
  const intermediaryCurrencyAmount = useIntermediaryCurrencyAmount(typeInfo, skipIntermediaryCheck) ?? undefined

  return useMemo(
    () => ({ inputCurrency, intermediaryCurrencyAmount, ...getStepFlags(typeInfo) }),
    [inputCurrency, intermediaryCurrencyAmount, typeInfo],
  )
}

function getIntermediaryCurrency(typeInfo: PlanTransactionInfo):
  | {
      intermediaryCurrencyId: string
      intermediaryAmountRaw: string
    }
  | undefined {
  const lastCompleteStep = typeInfo.stepDetails.findLast((stepInfo) => stepInfo.status === TransactionStatus.Success)
  if (!lastCompleteStep) {
    return undefined
  }

  const intermediaryCurrencyId = extractTransactionTypeInfoAttribute(lastCompleteStep.typeInfo, 'outputCurrencyId')
  const intermediaryAmountRaw = extractTransactionTypeInfoAttribute(
    lastCompleteStep.typeInfo,
    'outputCurrencyAmountRaw',
  )
  if (!intermediaryCurrencyId || !intermediaryAmountRaw) {
    return undefined
  }

  return {
    intermediaryCurrencyId,
    intermediaryAmountRaw,
  }
}

function useIntermediaryCurrencyAmount(typeInfo: PlanTransactionInfo, skip: boolean): Maybe<CurrencyAmount<Currency>> {
  const result = useMemo(() => (skip ? undefined : getIntermediaryCurrency(typeInfo)), [typeInfo, skip])
  const intermediaryCurrencyInfo = useCurrencyInfo(result?.intermediaryCurrencyId)

  return useMemo(() => {
    if (!result?.intermediaryAmountRaw || !intermediaryCurrencyInfo?.currency) {
      return undefined
    }

    return getCurrencyAmount({
      value: result.intermediaryAmountRaw,
      valueType: ValueType.Raw,
      currency: intermediaryCurrencyInfo.currency,
    })
  }, [result?.intermediaryAmountRaw, intermediaryCurrencyInfo?.currency])
}

function getStepFlags(typeInfo: PlanTransactionInfo): { hasSwapped: boolean; hasBridged: boolean } {
  const hasSwapped = typeInfo.stepDetails.some(
    (stepInfo) => stepInfo.typeInfo.type === TransactionType.Swap && stepInfo.status === TransactionStatus.Success,
  )
  const hasBridged = typeInfo.stepDetails.some(
    (stepInfo) => stepInfo.typeInfo.type === TransactionType.Bridge && stepInfo.status === TransactionStatus.Success,
  )
  return { hasSwapped, hasBridged }
}
