import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PropsWithChildren, ReactNode } from 'react'
// eslint-disable-next-line no-restricted-imports
import {
  addFiatSymbolToNumber,
  formatCurrencyAmount,
  formatNumberOrString,
  formatPercent,
} from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import { LocalizationContextState } from 'wallet/src/features/language/LocalizationContext'

export const noOpFunction = (): void => {
  return
}

export const mockLocalizedFormatter: LocalizationContextState = {
  formatCurrencyAmount(input): string {
    return formatCurrencyAmount({ ...input, amount: input.value, locale: 'en-US' })
  },
  formatNumberOrString(input): string {
    return formatNumberOrString({
      ...input,
      price: input.value,
      locale: 'en-US',
      type: input.type || NumberType.TokenNonTx,
    })
  },
  formatPercent(value) {
    return formatPercent(value, 'en-US')
  },
  addFiatSymbolToNumber(input): string {
    return addFiatSymbolToNumber({
      ...input,
      locale: 'en-US',
    })
  },
  convertFiatAmount(_?: number | undefined): { amount: number; currency: FiatCurrency } {
    throw new Error('Function not implemented.')
  },
  convertFiatAmountFormatted(): string {
    throw new Error('Function not implemented.')
  },
}

export const mockFiatConverter: LocalizationContextState = {
  convertFiatAmount(amount): { amount: number; currency: FiatCurrency } {
    return { amount: amount ?? 1, currency: FiatCurrency.UnitedStatesDollar }
  },
  convertFiatAmountFormatted(fromAmount, numberType, placeholder) {
    return mockLocalizedFormatter.formatNumberOrString({
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
  addFiatSymbolToNumber(_: {
    value: Maybe<string | number>
    currencyCode: string
    currencySymbol: string
  }): string {
    throw new Error('Function not implemented.')
  },
}

export const mockLocalizationContext = {
  LocalizationContextProvider: ({ children }: PropsWithChildren): ReactNode => children,
  useLocalizationContext: (): LocalizationContextState => ({
    convertFiatAmount: mockFiatConverter.convertFiatAmount,
    convertFiatAmountFormatted: mockFiatConverter.convertFiatAmountFormatted,
    formatNumberOrString: mockLocalizedFormatter.formatNumberOrString,
    formatCurrencyAmount: mockLocalizedFormatter.formatCurrencyAmount,
    formatPercent: mockLocalizedFormatter.formatPercent,
    addFiatSymbolToNumber: mockLocalizedFormatter.addFiatSymbolToNumber,
  }),
}
