import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { usePrefilledNeedsTokenProtectionWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'

type UseCurrenciesWithProtectionWarnings = () =>
  | {
      currencyInfo0: undefined
      currencyInfo1: undefined
    }
  | {
      currencyInfo0: CurrencyInfo
      currencyInfo1: undefined | CurrencyInfo
    }

export const useCurrenciesWithProtectionWarnings: UseCurrenciesWithProtectionWarnings = () => {
  const { derivedSwapInfo, prefilledCurrencies } = useSwapFormContext()

  const { currenciesWithProtectionWarnings } = usePrefilledNeedsTokenProtectionWarning(
    derivedSwapInfo,
    prefilledCurrencies,
  )

  const maybeCurrencyInfo0 = currenciesWithProtectionWarnings[0]

  if (maybeCurrencyInfo0 === undefined) {
    return {
      currencyInfo0: undefined,
      currencyInfo1: undefined,
    }
  }

  return {
    currencyInfo0: maybeCurrencyInfo0,
    currencyInfo1: currenciesWithProtectionWarnings[1],
  }
}
