import { useMemo } from 'react'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { NumberType } from 'utilities/src/format/types'

export function useActualSwapOutput(): {
  outputCurrencyInfo?: CurrencyInfo
  lastSwapOutputBalance: string | undefined
} {
  const { formatCurrencyAmount } = useLocalizationContext()

  const instantReceiptFetchTime = useSwapFormStore((s) => s.instantReceiptFetchTime)

  const { derivedSwapInfo } = useSwapDependenciesStore((s) => ({ derivedSwapInfo: s.derivedSwapInfo }))
  const instantOutputAmountRaw = useSwapFormStore((s) => s.instantOutputAmountRaw)

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
  }, [outputCurrencyInfo, instantOutputAmountRaw, formatCurrencyAmount, instantReceiptFetchTime])

  return {
    outputCurrencyInfo,
    lastSwapOutputBalance: swapOutputAmountFinal,
  }
}
