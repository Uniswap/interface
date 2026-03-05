import { formatUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, SpinningLoader } from 'ui/src'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useResumePlanMutation } from 'uniswap/src/features/transactions/swap/plan/intermediaryState/useResumePlanMutation'
import { PlanTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useEvent } from 'utilities/src/react/hooks'

export function ResumePlanButton({
  typeInfo,
  onSuccess,
}: {
  typeInfo: PlanTransactionInfo
  onSuccess?: () => void
}): JSX.Element {
  const { planId, inputCurrencyId, outputCurrencyId, inputCurrencyAmountRaw } = typeInfo
  const { t } = useTranslation()

  const inputCurrencyDecimals = useCurrencyInfo(typeInfo.inputCurrencyId)?.currency.decimals
  const inputCurrencyAmount = useMemo(() => {
    if (!inputCurrencyDecimals) {
      return undefined
    }
    return formatUnits(inputCurrencyAmountRaw, inputCurrencyDecimals)
  }, [inputCurrencyAmountRaw, inputCurrencyDecimals])

  const { mutate: resumePlan, isPending, isSuccess } = useResumePlanMutation({ successCallback: onSuccess })

  const onPress = useEvent(() => {
    if (inputCurrencyAmount) {
      resumePlan({
        planId,
        inputCurrencyId,
        outputCurrencyId,
        inputCurrencyAmount,
      })
    }
  })

  // A loading state should be shown if:
  // - The mutation is pending
  // - The mutation is successful (the app is about to navigate)
  // - The input currency amount is undefined/loading
  const loading = isPending || isSuccess || !inputCurrencyAmount

  return (
    <Button
      isDisabled={loading}
      size="medium"
      emphasis="primary"
      variant="branded"
      icon={isPending ? <SpinningLoader /> : undefined}
      onPress={onPress}
    >
      {t('transaction.status.plan.completeSwap')}
    </Button>
  )
}
