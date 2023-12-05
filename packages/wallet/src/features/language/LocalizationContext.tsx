import { createContext, ReactNode, useContext, useMemo } from 'react'
// eslint-disable-next-line no-restricted-imports
import { useFiatConverter } from 'wallet/src/features/fiatCurrency/conversion'
// eslint-disable-next-line no-restricted-imports
import { useLocalizedFormatter } from 'wallet/src/features/language/formatter'

export type LocalizationContextState = {
  convertFiatAmount: ReturnType<typeof useFiatConverter>['convertFiatAmount']
  convertFiatAmountFormatted: ReturnType<typeof useFiatConverter>['convertFiatAmountFormatted']
  formatNumberOrString: ReturnType<typeof useLocalizedFormatter>['formatNumberOrString']
  formatCurrencyAmount: ReturnType<typeof useLocalizedFormatter>['formatCurrencyAmount']
  formatPercent: ReturnType<typeof useLocalizedFormatter>['formatPercent']
  addFiatSymbolToNumber: ReturnType<typeof useLocalizedFormatter>['addFiatSymbolToNumber']
}

export const LocalizationContext = createContext<LocalizationContextState | undefined>(undefined)

export function LocalizationContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const { formatNumberOrString, formatCurrencyAmount, formatPercent, addFiatSymbolToNumber } =
    useLocalizedFormatter()

  const { convertFiatAmount, convertFiatAmountFormatted } = useFiatConverter({
    formatNumberOrString,
  })

  const state = useMemo<LocalizationContextState>(
    (): LocalizationContextState => ({
      convertFiatAmount,
      convertFiatAmountFormatted,
      formatNumberOrString,
      formatCurrencyAmount,
      formatPercent,
      addFiatSymbolToNumber,
    }),
    [
      addFiatSymbolToNumber,
      convertFiatAmount,
      convertFiatAmountFormatted,
      formatCurrencyAmount,
      formatNumberOrString,
      formatPercent,
    ]
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
