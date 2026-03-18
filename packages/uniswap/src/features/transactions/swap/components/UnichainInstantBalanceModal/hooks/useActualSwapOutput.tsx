import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { NumberType } from 'utilities/src/format/types'

export function useActualSwapOutput(): {
  outputCurrencyInfo?: CurrencyInfo
  lastSwapOutputBalance: string | undefined
} {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()

  const instantReceiptFetchTime = useSwapFormStore((s) => s.instantReceiptFetchTime)

  const { derivedSwapInfo } = useSwapDependenciesStore((s) => ({ derivedSwapInfo: s.derivedSwapInfo }))
  const instantOutputAmountRaw = useSwapFormStore((s) => s.instantOutputAmountRaw)

  const isTxSuccessfulButUnparsable = !!useSwapFormStore((s) => s.instantReceiptFetchTime)
  const outputAmountFromForm = useSwapDependenciesStore((s) =>
    s.derivedSwapInfo.currencyAmounts.output?.quotient.toString(),
  )

  const outputCurrencyInfo = derivedSwapInfo.currencies.output ?? undefined

  const swapOutputAmountFinal = useMemo(() => {
    if (!outputCurrencyInfo || !instantOutputAmountRaw) {
      return undefined
    }

    // this means the transaction has not completed
    // used to guard against showing old output amounts
    if (!instantReceiptFetchTime) {
      return undefined
    }

    if (Number(instantOutputAmountRaw) > 0) {
      return formatCurrencyAmount({
        value: getCurrencyAmount({
          value: instantOutputAmountRaw,
          valueType: ValueType.Raw,
          currency: outputCurrencyInfo.currency,
        }),
        type: NumberType.TokenTx,
      })
    }

    return undefined
  }, [outputCurrencyInfo, instantOutputAmountRaw, instantReceiptFetchTime, formatCurrencyAmount])

  const shouldEstimateOutput = outputCurrencyInfo && isTxSuccessfulButUnparsable && !swapOutputAmountFinal

  return {
    outputCurrencyInfo,
    lastSwapOutputBalance: shouldEstimateOutput
      ? t('common.approximatelyValue', {
          value: formatCurrencyAmount({
            value: getCurrencyAmount({
              value: outputAmountFromForm,
              valueType: ValueType.Raw,
              currency: outputCurrencyInfo.currency,
            }),
          }),
        })
      : swapOutputAmountFinal,
  }
}
