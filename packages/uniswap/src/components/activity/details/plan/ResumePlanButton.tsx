import { TradingApi } from '@universe/api'
import { formatUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, SpinningLoader } from 'ui/src'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useIsPriceChangeInterrupted } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useIsPriceChangeInterrupted'
import { useResumePlanMutation } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useResumePlanMutation'
import { PlanTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useEvent } from 'utilities/src/react/hooks'

export function ResumePlanButton({
  typeInfo,
  onSuccess,
  isEarnActivityDisplayEnabled = true,
}: {
  typeInfo: PlanTransactionInfo
  onSuccess?: () => void
  isEarnActivityDisplayEnabled?: boolean
}): JSX.Element | null {
  const { planId, inputCurrencyId, outputCurrencyId, inputCurrencyAmountRaw } = typeInfo
  const { t } = useTranslation()
  const isPriceChangeInterrupted = useIsPriceChangeInterrupted(planId)

  const inputCurrencyDecimals = useCurrencyInfo(typeInfo.inputCurrencyId)?.currency.decimals
  const inputCurrencyAmount = useMemo(() => {
    if (!inputCurrencyDecimals) {
      return undefined
    }
    return formatUnits(inputCurrencyAmountRaw, inputCurrencyDecimals)
  }, [inputCurrencyAmountRaw, inputCurrencyDecimals])

  const { mutate: resumePlan, isPending, isSuccess } = useResumePlanMutation({ successCallback: onSuccess })
  const resumeButtonLabel = useMemo(() => {
    if (isPriceChangeInterrupted) {
      return t('transaction.status.plan.priceChange.viewNewPrice')
    }

    switch (typeInfo.earnAction) {
      case TradingApi.EarnAction.DEPOSIT:
        return t('explore.earn.review.deposit.idleFallback')
      case TradingApi.EarnAction.WITHDRAW:
        return t('explore.earn.review.withdraw.idleFallback')
      default:
        return t('transaction.status.plan.completeSwap')
    }
  }, [isPriceChangeInterrupted, t, typeInfo.earnAction])

  const onPress = useEvent(() => {
    if (inputCurrencyAmount) {
      resumePlan({
        planId,
        inputCurrencyId,
        outputCurrencyId,
        inputCurrencyAmount,
        earnAction: typeInfo.earnAction,
        isEarnActivityDisplayEnabled,
      })
    }
  })

  if (typeInfo.earnAction && !isEarnActivityDisplayEnabled) {
    return null
  }

  // A loading state should be shown if:
  // - The mutation is pending
  // - The mutation is successful (the app is about to navigate)
  // - The input currency amount is undefined/loading
  const loading = isPending || isSuccess || !inputCurrencyAmount

  return (
    <Button
      disabled={loading}
      size="medium"
      emphasis="primary"
      variant="branded"
      icon={isPending ? <SpinningLoader /> : undefined}
      onPress={onPress}
    >
      {resumeButtonLabel}
    </Button>
  )
}
