import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PropsWithChildren, ReactNode } from 'react'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Locale } from 'uniswap/src/features/language/constants'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import {
  addFiatSymbolToNumber,
  formatCurrencyAmount,
  formatNumberOrString,
  formatPercent,
} from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'

export function mockLocalizedFormatter(locale: Locale): LocalizationContextState {
  return {
    conversionRate: 1,
    formatCurrencyAmount(input): string {
      return formatCurrencyAmount({ ...input, amount: input.value, locale })
    },
    formatNumberOrString(input): string {
      return formatNumberOrString({
        ...input,
        price: input.value,
        locale,
        type: input.type || NumberType.TokenNonTx,
      })
    },
    formatPercent(value): string {
      return formatPercent({ rawPercentage: value, locale })
    },
    addFiatSymbolToNumber(input): string {
      return addFiatSymbolToNumber({
        ...input,
        locale,
      })
    },
    convertFiatAmount(_?: number | undefined): { amount: number; currency: FiatCurrency } {
      throw new Error('Function not implemented.')
    },
    convertFiatAmountFormatted(): string {
      throw new Error('Function not implemented.')
    },
  }
}

export function mockFiatConverter({
  locale,
  currency,
}: {
  locale: Locale
  currency: FiatCurrency
}): LocalizationContextState {
  return {
    conversionRate: 1,
    convertFiatAmount(amount): { amount: number; currency: FiatCurrency } {
      return { amount, currency }
    },
    // eslint-disable-next-line max-params
    convertFiatAmountFormatted(fromAmount, numberType, placeholder): string {
      return mockLocalizedFormatter(locale).formatNumberOrString({
        value: fromAmount,
        type: numberType,
        placeholder,
      })
    },
    formatNumberOrString(_: {
      value: Maybe<string | number>
      type?: NumberType | undefined
      currencyCode?: string | undefined
      placeholder?: string | undefined
    }): string {
      throw new Error('Function not implemented.')
    },
    formatCurrencyAmount(_: {
      value: CurrencyAmount<Currency> | null | undefined
      type?: NumberType | undefined
      placeholder?: string | undefined
    }): string {
      throw new Error('Function not implemented.')
    },
    formatPercent(_: Maybe<string | number>): string {
      throw new Error('Function not implemented.')
    },
    addFiatSymbolToNumber(_: { value: Maybe<string | number>; currencyCode: string; currencySymbol: string }): string {
      throw new Error('Function not implemented.')
    },
  }
}

export function mockLocalizationContext({
  locale = Locale.EnglishUnitedStates,
  currency = FiatCurrency.UnitedStatesDollar,
}: {
  locale?: Locale
  currency?: FiatCurrency
}): {
  LocalizationContextProvider: ({ children }: PropsWithChildren) => ReactNode
  useLocalizationContext: () => LocalizationContextState
} {
  const fiatMock = mockFiatConverter({ currency, locale })
  const formatterMock = mockLocalizedFormatter(locale)
  return {
    LocalizationContextProvider: ({ children }: PropsWithChildren): ReactNode => children,
    useLocalizationContext: (): LocalizationContextState => ({
      conversionRate: 1,
      convertFiatAmount: fiatMock.convertFiatAmount,
      convertFiatAmountFormatted: fiatMock.convertFiatAmountFormatted,
      formatNumberOrString: formatterMock.formatNumberOrString,
      formatCurrencyAmount: formatterMock.formatCurrencyAmount,
      formatPercent: formatterMock.formatPercent,
      addFiatSymbolToNumber: formatterMock.addFiatSymbolToNumber,
    }),
  }
}
