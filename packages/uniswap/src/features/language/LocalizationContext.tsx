import { createContext, ReactNode, useContext, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useFiatConverter } from 'uniswap/src/features/fiatCurrency/conversion'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useLocalizedFormatter } from 'uniswap/src/features/language/formatter'

export type LocalizationContextState = {
  conversionRate: ReturnType<typeof useFiatConverter>['conversionRate']
  convertFiatAmount: ReturnType<typeof useFiatConverter>['convertFiatAmount']
  convertFiatAmountFormatted: ReturnType<typeof useFiatConverter>['convertFiatAmountFormatted']
  formatNumberOrString: ReturnType<typeof useLocalizedFormatter>['formatNumberOrString']
  formatCurrencyAmount: ReturnType<typeof useLocalizedFormatter>['formatCurrencyAmount']
  formatPercent: ReturnType<typeof useLocalizedFormatter>['formatPercent']
  addFiatSymbolToNumber: ReturnType<typeof useLocalizedFormatter>['addFiatSymbolToNumber']
}

export const LocalizationContext = createContext<LocalizationContextState | undefined>(undefined)

export function LocalizationContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const { formatNumberOrString, formatCurrencyAmount, formatPercent, addFiatSymbolToNumber } = useLocalizedFormatter()

  const { convertFiatAmount, convertFiatAmountFormatted, conversionRate } = useFiatConverter({
    formatNumberOrString,
  })

  const state = useMemo<LocalizationContextState>(
    (): LocalizationContextState => ({
      conversionRate,
      convertFiatAmount,
      convertFiatAmountFormatted,
      formatNumberOrString,
      formatCurrencyAmount,
      formatPercent,
      addFiatSymbolToNumber,
    }),
    [
      addFiatSymbolToNumber,
      conversionRate,
      convertFiatAmount,
      convertFiatAmountFormatted,
      formatCurrencyAmount,
      formatNumberOrString,
      formatPercent,
    ],
  )

  return <LocalizationContext.Provider value={state}>{children}</LocalizationContext.Provider>
}

export const useLocalizationContext = (): LocalizationContextState => {
  const localizationContext = useContext(LocalizationContext)

  if (localizationContext === undefined) {
    throw new Error('`useLocalizationContext` must be used inside of `LocalizationContextProvider`')
  }

  return localizationContext
}
