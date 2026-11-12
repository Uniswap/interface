import { getMarginDisplayCurrencyId } from 'uniswap/src/features/transactions/margin/marginDisplayCurrencyId'
import { getMarginPlanStatusTitleKey } from 'uniswap/src/features/transactions/margin/planActivityTitles'
import { type PlanTransactionInfo, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ActivityAmountModel, ActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'

function isAmount(amountRaw: string): boolean {
  return !!amountRaw && amountRaw !== '0'
}

function buildMarginPlanAmount(
  typeInfo: PlanTransactionInfo,
  marginAction: NonNullable<PlanTransactionInfo['marginAction']>,
): ActivityAmountModel {
  const { inputCurrencyId, outputCurrencyId, inputCurrencyAmountRaw, outputCurrencyAmountRaw } = typeInfo
  if (!isAmount(inputCurrencyAmountRaw) || !isAmount(outputCurrencyAmountRaw)) {
    return {
      kind: 'multi-token',
      currencyIds: [marginAction.collateralCurrencyId, marginAction.debtCurrencyId].map(getMarginDisplayCurrencyId),
    }
  }
  return {
    kind: 'pair',
    inputCurrencyId: getMarginDisplayCurrencyId(inputCurrencyId),
    outputCurrencyId: getMarginDisplayCurrencyId(outputCurrencyId),
    inputAmountRaw: inputCurrencyAmountRaw,
    outputAmountRaw: outputCurrencyAmountRaw,
  }
}

// What the plan paid in and the margin it deposited; no filter group fits, so it only shows under All.
export function buildMarginPlanActivityRowFragments(
  typeInfo: PlanTransactionInfo,
  status: TransactionStatus,
): ActivityRowFragments {
  const { marginAction } = typeInfo
  if (!marginAction) {
    return {}
  }
  return {
    amount: buildMarginPlanAmount(typeInfo, marginAction),
    counterparty: null,
    typeLabel: { baseGroup: null, overrideLabelKey: getMarginPlanStatusTitleKey(marginAction.action, status) },
  }
}
