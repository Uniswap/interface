import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

const DEFAULT_PLACEHOLDER = '—'

interface UseFormattedGasFeeResult {
  formattedGasFee: string | undefined
  gasFeeUsdValue: CurrencyAmount<Currency> | null
}

export function useFormattedGasFee({
  gasFeeCurrencyAmount,
  placeholder = DEFAULT_PLACEHOLDER,
}: {
  gasFeeCurrencyAmount: CurrencyAmount<Currency> | undefined
  placeholder?: string
}): UseFormattedGasFeeResult {
  const { formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()
  const gasFeeUsdValue = useUSDCValue(gasFeeCurrencyAmount)

  const formattedGasFee = useMemo(() => {
    if (!gasFeeCurrencyAmount) {
      return undefined
    }

    if (gasFeeUsdValue) {
      const fiatValue = Number(gasFeeUsdValue.toExact())
      if (Number.isFinite(fiatValue)) {
        return convertFiatAmountFormatted(fiatValue, NumberType.FiatGasPrice, placeholder)
      }
    }

    return `${formatCurrencyAmount({ value: gasFeeCurrencyAmount, type: NumberType.TokenNonTx })} ${
      gasFeeCurrencyAmount.currency.symbol ?? ''
    }`.trim()
  }, [convertFiatAmountFormatted, formatCurrencyAmount, gasFeeCurrencyAmount, gasFeeUsdValue, placeholder])

  return { formattedGasFee, gasFeeUsdValue }
}
