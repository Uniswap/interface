import { getDepositWithdrawDisplayCurrencyId } from 'uniswap/src/features/activity/utils/getDepositWithdrawDisplayCurrencyId'
import { getEarnPlanTransactionType } from 'uniswap/src/features/earn/planActivityTitles'
import {
  DepositTransactionInfo,
  PlanTransactionInfo,
  TransactionDetails,
  TransactionType,
  WithdrawTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export type EarnPlanDisplayInfo = {
  amountRaw: string
  currencyId: string
  transactionType: TransactionType.Deposit | TransactionType.Withdraw
}

export type EarnPlanVaultStep = TransactionDetails & {
  typeInfo: (DepositTransactionInfo | WithdrawTransactionInfo) & {
    isVault: true
  }
}

export function getEarnPlanDisplayInfo(typeInfo: PlanTransactionInfo): EarnPlanDisplayInfo | undefined {
  const earnAction = typeInfo.earnAction

  if (!earnAction) {
    return undefined
  }

  const transactionType = getEarnPlanTransactionType(earnAction)
  const isWithdraw = transactionType === TransactionType.Withdraw
  const vaultStep = getEarnPlanVaultStep(typeInfo)

  if (!isWithdraw && vaultStep?.typeInfo.currencyAmountRaw) {
    return {
      amountRaw: vaultStep.typeInfo.currencyAmountRaw,
      currencyId: getDepositWithdrawDisplayCurrencyId({ chainId: vaultStep.chainId, typeInfo: vaultStep.typeInfo }),
      transactionType,
    }
  }

  return {
    amountRaw: isWithdraw ? typeInfo.outputCurrencyAmountRaw : typeInfo.inputCurrencyAmountRaw,
    currencyId: isWithdraw ? typeInfo.outputCurrencyId : typeInfo.inputCurrencyId,
    transactionType,
  }
}

export function getEarnPlanVaultStep(typeInfo: PlanTransactionInfo): EarnPlanVaultStep | undefined {
  return typeInfo.stepDetails.find(isEarnPlanVaultStep)
}

function isEarnPlanVaultStep(step: TransactionDetails): step is EarnPlanVaultStep {
  const { typeInfo } = step

  return (
    (typeInfo.type === TransactionType.Deposit || typeInfo.type === TransactionType.Withdraw) &&
    typeInfo.isVault === true
  )
}
